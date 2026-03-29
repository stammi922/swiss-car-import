// Vehicle lookup orchestrator — merges data from static DB, FuelEconomy.gov, and NHTSA

import vehicleData from '@/data/vehicles.json';
import {
  getAllMakes,
  getModelsForMakeYear,
  decodeVin,
  getFuelEcoOptions,
  getFuelEcoVehicle,
} from './vehicleApi';

// --- Types ---

export type Co2Standard = 'WLTP' | 'NEDC';

export interface VehicleSpecs {
  mass_kg?: number;
  co2_wltp?: number;
  co2_standard?: Co2Standard;
  engine_cc?: number;
  fuel?: string;
  power_kw?: number;
  source: 'static' | 'epa' | 'nhtsa' | 'manual';
}

export interface StaticVehicle {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  mass_kg?: number;
  co2_wltp?: number;
  co2_nedc?: number;
  engine_cc?: number;
  fuel?: string;
  power_kw?: number;
  variants?: StaticVariant[];
}

export interface StaticVariant {
  variant: string;
  mass_kg: number;
  co2_wltp?: number;
  co2_nedc?: number;
  engine_cc: number;
  fuel: string;
  power_kw: number;
}

// --- WMI Code lookup for EU VIN detection ---

const WMI_CODES: Record<string, string> = {
  'WUA': 'Audi',
  'WAU': 'Audi',
  'WVW': 'Volkswagen',
  'WVG': 'Volkswagen',
  'WBA': 'BMW',
  'WBS': 'BMW',
  'WBY': 'BMW',
  'WDB': 'Mercedes-Benz',
  'WDC': 'Mercedes-Benz',
  'WDD': 'Mercedes-Benz',
  'W1K': 'Mercedes-Benz',
  'W1N': 'Mercedes-Benz',
  'ZFF': 'Ferrari',
  'ZHW': 'Lamborghini',
  'ZAR': 'Alfa Romeo',
  'ZAM': 'Maserati',
  'ZFA': 'Fiat',
  'SAJ': 'Jaguar',
  'SAL': 'Land Rover',
  'SBM': 'McLaren',
  'SCF': 'Aston Martin',
  'SCC': 'Lotus',
  'WP0': 'Porsche',
  'WP1': 'Porsche',
  'TRU': 'Audi',
  'YV1': 'Volvo',
  'YS3': 'Saab',
  'VF1': 'Renault',
  'VF3': 'Peugeot',
  'VF7': 'Citroën',
  'WF0': 'Ford',
  'TMB': 'Skoda',
  'VSS': 'SEAT',
  'JTD': 'Toyota',
  'JN1': 'Nissan',
  'JHM': 'Honda',
  'JMZ': 'Mazda',
  'JF1': 'Subaru',
  'JF2': 'Subaru',
  'KMH': 'Hyundai',
  'KNA': 'Kia',
  'KNM': 'Kia',
  'SFZ': 'Bentley',
  'SCA': 'Rolls-Royce',
};

// --- Make aliases for fuzzy matching ---
const MAKE_ALIASES: Record<string, string> = {
  'mercedes': 'Mercedes-Benz',
  'merc': 'Mercedes-Benz',
  'mb': 'Mercedes-Benz',
  'benz': 'Mercedes-Benz',
  'vw': 'Volkswagen',
  'chevy': 'Chevrolet',
  'lambo': 'Lamborghini',
  'alfa': 'Alfa Romeo',
  'rr': 'Rolls-Royce',
  'lr': 'Land Rover',
  'jlr': 'Land Rover',
  'aston': 'Aston Martin',
};

// --- Static DB access ---

const vehicles = vehicleData.vehicles as StaticVehicle[];

/** Get the effective CO2 value and standard from a variant or vehicle entry */
function getCo2(entry: { co2_wltp?: number; co2_nedc?: number }): { co2: number | undefined; standard: Co2Standard } {
  if (entry.co2_wltp !== undefined) {
    return { co2: entry.co2_wltp, standard: 'WLTP' };
  }
  if (entry.co2_nedc !== undefined) {
    return { co2: entry.co2_nedc, standard: 'NEDC' };
  }
  return { co2: undefined, standard: 'WLTP' };
}

export function getStaticMakes(): string[] {
  return Array.from(new Set(vehicles.map(v => v.make))).sort();
}

export function getStaticModels(make: string): string[] {
  const normalizedMake = normalizeMake(make);
  return Array.from(new Set(
    vehicles
      .filter(v => v.make.toLowerCase() === normalizedMake.toLowerCase())
      .map(v => v.model)
  )).sort();
}

export function getStaticVariants(make: string, model: string, year?: number): StaticVariant[] {
  const normalizedMake = normalizeMake(make);
  const entries = vehicles.filter(v => {
    if (v.make.toLowerCase() !== normalizedMake.toLowerCase()) return false;
    if (v.model.toLowerCase() !== model.toLowerCase()) return false;
    if (year && (year < v.yearFrom || year > v.yearTo)) return false;
    return true;
  });

  // Collect variants from all matching entries (there might be multiple year ranges)
  const allVariants: StaticVariant[] = [];
  for (const entry of entries) {
    if (entry.variants) {
      allVariants.push(...entry.variants);
    }
  }
  return allVariants;
}

export function lookupStatic(make: string, model: string, year?: number, variant?: string): VehicleSpecs | null {
  const normalizedMake = normalizeMake(make);
  const entry = vehicles.find(v => {
    if (v.make.toLowerCase() !== normalizedMake.toLowerCase()) return false;
    if (v.model.toLowerCase() !== model.toLowerCase()) return false;
    if (year && (year < v.yearFrom || year > v.yearTo)) return false;
    return true;
  });

  if (!entry) return null;

  // If variant specified and variants exist, look for specific variant
  if (variant && entry.variants) {
    const v = entry.variants.find(vr =>
      vr.variant.toLowerCase() === variant.toLowerCase()
    );
    if (v) {
      const { co2, standard } = getCo2(v);
      return {
        mass_kg: v.mass_kg,
        co2_wltp: co2,
        co2_standard: standard,
        engine_cc: v.engine_cc,
        fuel: v.fuel,
        power_kw: v.power_kw,
        source: 'static',
      };
    }
  }

  // If no variants or no variant match, use top-level data or first variant
  if (entry.mass_kg !== undefined) {
    const { co2, standard } = getCo2(entry);
    return {
      mass_kg: entry.mass_kg,
      co2_wltp: co2,
      co2_standard: standard,
      engine_cc: entry.engine_cc,
      fuel: entry.fuel,
      power_kw: entry.power_kw,
      source: 'static',
    };
  }

  // Use first variant as default
  if (entry.variants && entry.variants.length > 0) {
    const first = entry.variants[0];
    const { co2, standard } = getCo2(first);
    return {
      mass_kg: first.mass_kg,
      co2_wltp: co2,
      co2_standard: standard,
      engine_cc: first.engine_cc,
      fuel: first.fuel,
      power_kw: first.power_kw,
      source: 'static',
    };
  }

  return null;
}

// --- EU VIN Detection ---

export interface EuVinResult {
  isEuVin: boolean;
  make?: string;
  wmi?: string;
}

export function detectEuVin(vin: string): EuVinResult {
  if (vin.length < 6) return { isEuVin: false };

  const wmi = vin.substring(0, 3).toUpperCase();
  const positions456 = vin.substring(3, 6).toUpperCase();

  // EU VINs often have ZZZ in positions 4-6
  const isEuVin = positions456 === 'ZZZ';

  if (isEuVin) {
    const make = WMI_CODES[wmi];
    return { isEuVin: true, make, wmi };
  }

  return { isEuVin: false };
}

// --- Fuzzy matching ---

export function normalizeMake(input: string): string {
  const lower = input.trim().toLowerCase();
  if (MAKE_ALIASES[lower]) return MAKE_ALIASES[lower];

  // Try to find closest static make
  const staticMakes = getStaticMakes();
  const exact = staticMakes.find(m => m.toLowerCase() === lower);
  if (exact) return exact;

  const startsWith = staticMakes.find(m => m.toLowerCase().startsWith(lower));
  if (startsWith) return startsWith;

  const contains = staticMakes.find(m => m.toLowerCase().includes(lower));
  if (contains) return contains;

  return input.trim();
}

export function fuzzyMatchMakes(query: string): string[] {
  if (!query || query.length < 1) return getStaticMakes();

  const lower = query.trim().toLowerCase();

  // Check aliases first
  if (MAKE_ALIASES[lower]) {
    return [MAKE_ALIASES[lower]];
  }

  const staticMakes = getStaticMakes();

  // Exact match
  const exact = staticMakes.filter(m => m.toLowerCase() === lower);
  if (exact.length > 0) return exact;

  // Starts with
  const starts = staticMakes.filter(m => m.toLowerCase().startsWith(lower));

  // Contains
  const contains = staticMakes.filter(m =>
    m.toLowerCase().includes(lower) && !starts.includes(m)
  );

  // Also check alias matches
  const aliasMatches = Object.entries(MAKE_ALIASES)
    .filter(([alias]) => alias.startsWith(lower))
    .map(([, make]) => make)
    .filter(make => !starts.includes(make) && !contains.includes(make));

  return [...starts, ...contains, ...aliasMatches].slice(0, 10);
}

export function fuzzyMatchModels(models: string[], query: string): string[] {
  if (!query || query.length < 1) return models;
  const lower = query.trim().toLowerCase();

  const starts = models.filter(m => m.toLowerCase().startsWith(lower));
  const contains = models.filter(m =>
    m.toLowerCase().includes(lower) && !starts.includes(m)
  );
  return [...starts, ...contains];
}

// --- NHTSA make list (for completeness beyond static DB) ---

let nhtsaMakesCache: string[] | null = null;

export async function getAllMakeNames(): Promise<string[]> {
  if (nhtsaMakesCache) return nhtsaMakesCache;

  const staticMakes = getStaticMakes();

  try {
    const nhtsaMakes = await getAllMakes();
    const allMakeNames = new Set<string>(staticMakes);
    for (const m of nhtsaMakes) {
      // Title case NHTSA makes for consistency
      const name = m.makeName.split(' ').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join(' ');
      allMakeNames.add(name);
    }
    nhtsaMakesCache = Array.from(allMakeNames).sort();
    return nhtsaMakesCache;
  } catch {
    return staticMakes;
  }
}

export async function getModelNames(make: string, year: number): Promise<string[]> {
  const staticModels = getStaticModels(make);

  try {
    const nhtsaModels = await getModelsForMakeYear(make, year);
    const allModels = new Set<string>(staticModels);
    for (const m of nhtsaModels) {
      allModels.add(m.modelName);
    }
    return Array.from(allModels).sort();
  } catch {
    return staticModels;
  }
}

// --- Orchestrated lookup ---

function mapNHTSAFuel(fuel: string): string {
  const lower = fuel.toLowerCase();
  if (lower.includes('diesel')) return 'diesel';
  if (lower.includes('electric')) return 'electric';
  if (lower.includes('compressed natural gas') || lower.includes('cng')) return 'gas';
  if (lower.includes('hybrid')) return 'hybrid';
  return 'petrol';
}

function mapFuelEcoFuel(fuel: string): string {
  const lower = fuel.toLowerCase();
  if (lower.includes('diesel')) return 'diesel';
  if (lower.includes('electricity')) return 'electric';
  if (lower.includes('e85') || lower.includes('ethanol')) return 'petrol';
  return 'petrol';
}

export async function lookupVehicle(
  make: string,
  model: string,
  year: number,
  variant?: string
): Promise<VehicleSpecs> {
  // Priority 1: Static DB (has European WLTP/NEDC data)
  const staticResult = lookupStatic(make, model, year, variant);
  if (staticResult && staticResult.mass_kg && staticResult.co2_wltp !== undefined) {
    return staticResult;
  }

  // Priority 2: FuelEconomy.gov (has CO2 data)
  try {
    const options = await getFuelEcoOptions(year, normalizeMake(make), model);
    if (options.length > 0) {
      const option = options[0]; // Use first option
      const vehicle = await getFuelEcoVehicle(option.id);
      if (vehicle) {
        const epaSpecs: VehicleSpecs = {
          co2_wltp: vehicle.co2_gkm || undefined,
          co2_standard: 'WLTP', // EPA data converted
          engine_cc: vehicle.displ ? Math.round(vehicle.displ * 1000) : undefined,
          fuel: mapFuelEcoFuel(vehicle.fuelType),
          source: 'epa',
        };

        // Merge with static if we have partial static data
        if (staticResult) {
          return {
            mass_kg: staticResult.mass_kg || epaSpecs.mass_kg,
            co2_wltp: staticResult.co2_wltp || epaSpecs.co2_wltp,
            co2_standard: staticResult.co2_standard || epaSpecs.co2_standard,
            engine_cc: staticResult.engine_cc || epaSpecs.engine_cc,
            fuel: staticResult.fuel || epaSpecs.fuel,
            power_kw: staticResult.power_kw,
            source: staticResult.mass_kg ? 'static' : 'epa',
          };
        }
        return epaSpecs;
      }
    }
  } catch { /* continue to NHTSA */ }

  // If we have any static data, return it
  if (staticResult) return staticResult;

  // Priority 3: Return empty (user enters manually)
  return { source: 'manual' };
}

export async function lookupByVin(vin: string): Promise<VehicleSpecs & { make?: string; model?: string; year?: number; isEuVin?: boolean }> {
  // Check for EU VIN first
  const euVinResult = detectEuVin(vin);

  const nhtsaData = await decodeVin(vin);

  // If NHTSA returns no useful data and it's an EU VIN
  if ((!nhtsaData || !nhtsaData.make) && euVinResult.isEuVin) {
    return {
      make: euVinResult.make,
      isEuVin: true,
      source: 'manual',
    };
  }

  if (!nhtsaData || !nhtsaData.make) {
    // Even if not ZZZ pattern, try WMI lookup as fallback
    if (vin.length >= 3) {
      const wmi = vin.substring(0, 3).toUpperCase();
      const make = WMI_CODES[wmi];
      if (make) {
        return {
          make,
          isEuVin: euVinResult.isEuVin,
          source: 'manual',
        };
      }
    }
    return { source: 'manual' };
  }

  const year = parseInt(nhtsaData.modelYear) || 0;
  const weightKg = nhtsaData.curbWeightLB > 0
    ? Math.round(nhtsaData.curbWeightLB * 0.453592)
    : undefined;

  // Try to get more data from static DB + FuelEconomy
  const enriched = await lookupVehicle(nhtsaData.make, nhtsaData.model, year);

  return {
    make: nhtsaData.make,
    model: nhtsaData.model,
    year,
    isEuVin: euVinResult.isEuVin,
    mass_kg: enriched.mass_kg || weightKg,
    co2_wltp: enriched.co2_wltp,
    co2_standard: enriched.co2_standard,
    engine_cc: enriched.engine_cc || (nhtsaData.displacementCC > 0 ? Math.round(nhtsaData.displacementCC) : undefined),
    fuel: enriched.fuel || mapNHTSAFuel(nhtsaData.fuelType),
    power_kw: enriched.power_kw,
    source: enriched.source !== 'manual' ? enriched.source : 'nhtsa',
  };
}

// --- Brave Search Fallback ---

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export async function searchVehicleSpecs(make: string, model: string, year: number): Promise<SearchResult[]> {
  try {
    const res = await fetch(`/api/vehicle-search?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
