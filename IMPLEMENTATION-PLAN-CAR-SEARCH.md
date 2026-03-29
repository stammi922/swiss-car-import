# Smart Car Info Search — Implementation Plan

## Goal
Add a dropdown autocomplete that auto-fills vehicle specs (weight, CO2, engine, fuel type, etc.) when the user starts typing a car make/model/year, eliminating manual data entry.

## Research Findings (March 29, 2026)

### Available Free APIs

| Source | Data | Coverage | Rate Limits | Cost |
|--------|------|----------|-------------|------|
| **NHTSA vPIC** | Make, model, year, body class, engine, displacement, fuel type, GVWR, plant country | US + all imports (global makes) | Unlimited, free | $0 |
| **FuelEconomy.gov** | Make, model, year, CO2 g/mile, MPG, cylinders, displacement, fuel type, drive | US EPA-tested vehicles (1984–2026) | Unlimited, free | $0 |
| **EEA CO2 Cars** | Make, model, CO2 g/km (WLTP), mass (kg), engine capacity, fuel type, electric range | EU registrations (2010–2024) | Bulk CSV download (10M+ rows), no live API | $0 |
| **CarAPI.app** | Full specs incl. curb_weight, dimensions, engine | Good | 500 req/month free, $20/mo for 10K | Paid |
| **auto-data.net API** | Full specs | Good | Paid tiers | Paid |

### Recommended Architecture: Hybrid Free-Tier Stack

**Primary: NHTSA vPIC** (cascading menus + vehicle decode)
- `/api/vehicles/GetAllMakes` → full make list
- `/api/vehicles/GetModelsForMakeYear/make/{make}/modelyear/{year}` → models
- `/api/vehicles/DecodeVinValues/{VIN}` → full specs (if VIN provided)
- Returns: make, model, year, body class, displacement, cylinders, fuel type, drive type, GVWR
- **Missing: curb weight (sometimes empty), CO2 emissions**

**Secondary: FuelEconomy.gov** (CO2 + fuel economy data)
- `/ws/rest/vehicle/menu/year` → years
- `/ws/rest/vehicle/menu/make?year=YYYY` → makes for year
- `/ws/rest/vehicle/menu/model?year=YYYY&make=XXX` → models
- `/ws/rest/vehicle/menu/options?year=YYYY&make=XXX&model=YYY` → variant IDs
- `/ws/rest/vehicle/{id}` → full record with CO2 g/mile, MPG, weight class
- **Has: co2TailpipeGpm (CO2 g/mile), cylinders, displacement, fuel type**
- **Missing: curb weight in kg (not in API)**

**Tertiary: Static EEA Dataset** (European CO2 + mass data)
- Download latest CSV from EEA, extract unique make/model/mass/CO2 combos
- Pre-process into a ~2MB JSON lookup: `{make}/{model}/{year}` → `{mass_kg, co2_wltp_gkm, fuel_type, engine_cc}`
- This is the ONLY free source with **actual vehicle mass in kg** and **CO2 in g/km (WLTP)** — exactly what Swiss customs needs
- Update annually when EEA publishes new data

**Fallback: Brave Search** (for gaps)
- If no API match found, search `"{make} {model} {year} curb weight kg CO2 g/km specs"`
- Parse first result for weight/CO2 data
- Only fires if primary sources miss

### Why NOT use LLM for this?
- **Hallucination risk**: LLMs fabricate plausible-sounding but wrong specs (e.g., wrong weight by 200kg → wrong customs duty)
- **Cost**: Even cheap models cost per call; APIs are free
- **Speed**: API call = 200ms; LLM call = 2-5s
- **Reliability**: APIs return deterministic, authoritative data from manufacturer submissions
- LLM is the wrong tool here. Hard data needs hard sources.

## UI Design

### Step 1 (Vehicle Info) — Enhanced with Autocomplete

```
┌─────────────────────────────────────────────┐
│ 🚗 Vehicle Information                       │
│                                              │
│ Registration Year  [2024        ▼]           │
│                                              │
│ Make               [Aud          ]           │
│                    ┌─────────────────┐       │
│                    │ Audi            │       │
│                    │ Austin Martin   │       │
│                    └─────────────────┘       │
│                                              │
│ Model              [               ]         │
│   (populated after make selected)            │
│                                              │
│ Variant            [               ]         │
│   (populated after model selected)           │
│                                              │
│ ── OR enter VIN ──                           │
│ VIN                [WUAZZZ4G7EN... ]         │
│   → Auto-fills everything from VIN decode    │
│                                              │
│ ═══ Auto-filled (editable) ════════════      │
│ Vehicle Weight     [1,695 kg      ]  ✅      │
│ CO2 Emissions      [289 g/km      ]  ✅      │
│ Engine Capacity    [5,204 cc      ]  ✅      │
│ Fuel Type          [Petrol     ▼  ]  ✅      │
│ Drive Type         [AWD        ▼  ]          │
│ Power              [    kW / HP   ]          │
│                                              │
│ ✅ = auto-filled from database               │
│ Fields are always editable for corrections   │
└─────────────────────────────────────────────┘
```

### Cascading Flow
1. User selects **Year** → fetches makes for that year
2. User types/selects **Make** → fuzzy search against make list, fetches models
3. User selects **Model** → fetches variants/options
4. User selects **Variant** → auto-fills weight, CO2, engine, fuel type
5. **OR** user enters VIN → decodes everything in one shot

### Auto-Fill Priority Chain
For each field, try sources in order:
1. **EEA dataset** (has mass_kg + CO2 WLTP — exactly what Swiss customs uses)
2. **FuelEconomy.gov** (has CO2 g/mile → convert to g/km, plus engine specs)
3. **NHTSA vPIC** (has make/model structure, some GVWR data)
4. **User manual entry** (always possible, always editable)

### VIN Decode Path
- NHTSA vPIC DecodeVinValues → make, model, year, body, engine, fuel, plant country
- Then match against EEA for mass + CO2
- Fill all fields in one shot
- Works for any car with a standard 17-char VIN

## Technical Implementation

### New Files
```
src/
├── lib/
│   ├── vehicleApi.ts          # API client (NHTSA + FuelEconomy.gov)
│   ├── vehicleLookup.ts       # Orchestrator: cascading lookup + merge
│   └── eea-data.json          # Pre-processed EEA dataset (~2MB)
├── components/
│   ├── VehicleAutocomplete.tsx # Main autocomplete component
│   ├── VinDecoder.tsx          # VIN input with decode button
│   └── AutoFilledField.tsx     # Input with ✅ indicator
├── scripts/
│   └── process-eea-data.ts    # Script to process EEA CSV → JSON
```

### API Client (`vehicleApi.ts`)

```typescript
// NHTSA vPIC
async function getAllMakes(): Promise<VehicleMake[]>
async function getModelsForMakeYear(make: string, year: number): Promise<VehicleModel[]>
async function decodeVin(vin: string): Promise<VehicleSpecs>

// FuelEconomy.gov  
async function getFuelEcoMakes(year: number): Promise<string[]>
async function getFuelEcoModels(year: number, make: string): Promise<string[]>
async function getFuelEcoOptions(year: number, make: string, model: string): Promise<VehicleOption[]>
async function getVehicleRecord(id: number): Promise<FuelEcoVehicle>

// EEA Static Lookup
function lookupEEA(make: string, model: string, year?: number): EEARecord | null
```

### Data Processing (`process-eea-data.ts`)

Download EEA CSV → extract unique combinations → produce compact JSON:
```json
{
  "AUDI": {
    "R8": {
      "2023": { "mass_kg": 1695, "co2_wltp": 289, "engine_cc": 5204, "fuel": "petrol" },
      "2022": { "mass_kg": 1695, "co2_wltp": 289, "engine_cc": 5204, "fuel": "petrol" }
    },
    "A4": {
      "2024": [
        { "variant": "2.0 TFSI", "mass_kg": 1535, "co2_wltp": 152, "engine_cc": 1984, "fuel": "petrol" },
        { "variant": "2.0 TDI", "mass_kg": 1590, "co2_wltp": 128, "engine_cc": 1968, "fuel": "diesel" }
      ]
    }
  }
}
```

Processing:
1. Download `co2_passenger_cars_v24.csv` (~4GB raw)
2. Group by `Mk` (make), `Cn` (model), `year`, `Ft` (fuel type)
3. Average `m (kg)` (mass) and `Ewltp (g/km)` (CO2 WLTP) per group
4. Deduplicate → output ~2MB JSON (~15K unique make/model/year combos covering EU cars)
5. Ship as static asset in Next.js `/public/` or import directly

### Fuzzy Search

Use `Fuse.js` (already lightweight, no API needed) for:
- Make name fuzzy matching (handles "mercedes" → "Mercedes-Benz")
- Model name fuzzy matching
- Debounced (300ms) to avoid excessive API calls

### Caching Strategy

- **Makes list**: Cache in localStorage for 24h (doesn't change often)
- **Models per make+year**: Cache in sessionStorage
- **Vehicle records**: Cache in sessionStorage by ID
- **EEA data**: Static JSON, loaded once, cached in memory

### Integration with Existing Calculator

The auto-filled values feed directly into the existing cost engine:
- `mass_kg` → customs duty calculation (CHF 15 per 100kg)
- `co2_wltp` → CO2 sanction calculation
- `fuel_type` → affects emission category
- `engine_cc` → informational (shown on PDF)

Fields remain editable — user can always override auto-filled values.

## Steelman (Arguments Against This Approach)

### 1. "EEA dataset is too large — 4GB CSV is impractical"
**Counter:** We pre-process it into a ~2MB JSON. The processing script runs once (build time or manually). The app ships only the compact JSON. 2MB is fine for a Next.js static asset — it compresses to ~400KB gzipped.

### 2. "What about cars not in any database? (imports from Japan, older cars, kit cars)"
**Counter:** All fields remain manually editable. The autocomplete is a convenience, not a requirement. If no match found, user enters data manually — same as current behavior. We show a subtle "No match found — please enter manually" message.

### 3. "NHTSA is US-centric — won't have all European models"
**Counter:** NHTSA vPIC has excellent European coverage (all imports to US are registered). But the EEA dataset IS the authoritative European source — it covers every car sold in the EU. Between NHTSA + EEA + FuelEconomy.gov, coverage is >95% of cars anyone would import to Switzerland.

### 4. "Multiple API calls per selection = slow UX"
**Counter:** Cascading: year loads instantly (static list), make loads in ~200ms, model in ~200ms. Total < 1s with caching. VIN decode is a single call (~500ms). EEA lookup is instant (in-memory JSON). Users won't notice.

### 5. "CO2 g/mile from FuelEconomy.gov needs conversion"
**Counter:** Simple: `co2_gkm = co2_gpm / 1.60934`. But we prefer EEA's WLTP values anyway since Swiss customs uses European standards. FuelEconomy.gov is secondary/fallback only.

### 6. "Why not just use an LLM to fill in specs?"
**Counter:** This is a customs calculator. Wrong weight = wrong duty amount = real financial consequences. LLMs hallucinate specs. NHTSA/EEA data comes from manufacturer submissions to government agencies. Deterministic > probabilistic for financial calculations.

### 7. "The EEA data needs annual updates"
**Counter:** True, but the data changes once per year. We include a `lastUpdated` field and show "Data current as of 2024" in the UI. The processing script can be re-run when new data is published. Not a maintenance burden.

### Verdict: Approach survives steelman. Proceed.

The strongest concern is dataset freshness (EEA publishes annually). Mitigated by showing data vintage and allowing manual override. The architecture is sound: three free, authoritative data sources with graceful degradation.

## Execution Plan (for Opus Sub-Agent)

### Task 1: Process EEA Dataset
- Download latest EEA CO2 cars CSV
- Write processing script (Node.js/TypeScript)
- Generate compact JSON lookup file
- Validate: spot-check 10 popular cars (BMW 3 Series, VW Golf, Audi A4, etc.)

### Task 2: Build API Client
- Create `vehicleApi.ts` with NHTSA + FuelEconomy.gov clients
- Add response caching (sessionStorage)
- Add error handling + timeouts (3s per API call)
- Add CO2 unit conversion (g/mile → g/km)

### Task 3: Build Vehicle Lookup Orchestrator
- Create `vehicleLookup.ts` that merges data from all three sources
- Priority: EEA (mass+CO2) > FuelEconomy (CO2+engine) > NHTSA (make/model structure)
- Handle fuzzy matching for make/model names across sources
- Add VIN decode path

### Task 4: Build UI Components
- `VehicleAutocomplete` — cascading year → make → model → variant dropdown
- `VinDecoder` — VIN input with decode button
- `AutoFilledField` — input with ✅ indicator showing data source
- Integrate Fuse.js for fuzzy search
- Mobile-first responsive design matching existing wizard

### Task 5: Integrate with Calculator
- Wire auto-filled values into existing cost engine
- Ensure manual override still works
- Update PDF generation to show vehicle details
- Add "Data source: EEA/NHTSA/Manual" to PDF

### Task 6: Test & Deploy
- Test with 5 popular cars: BMW 3 Series, VW Golf, Audi R8, Tesla Model 3, Toyota Corolla
- Test VIN decode with real VINs
- Test manual fallback (obscure car)
- Test mobile UX
- Verify build passes
- Push to repo

## Estimated Time: 30–45 minutes (Opus agent)
