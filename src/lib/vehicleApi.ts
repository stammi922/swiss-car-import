// Vehicle API clients for NHTSA vPIC and FuelEconomy.gov

export interface VehicleMake {
  makeId: number;
  makeName: string;
}

export interface VehicleModel {
  modelId: number;
  modelName: string;
}

export interface NHTSASpecs {
  make: string;
  model: string;
  modelYear: string;
  bodyClass: string;
  displacementCC: number;
  cylinders: number;
  fuelType: string;
  driveType: string;
  gvwr: string;
  curbWeightLB: number;
  plantCountry: string;
}

export interface FuelEcoVehicle {
  id: number;
  year: number;
  make: string;
  model: string;
  cylinders: number;
  displ: number;
  fuelType: string;
  co2TailpipeGpm: number;
  co2_gkm: number;
  drive: string;
}

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const FUELECO_BASE = 'https://www.fueleconomy.gov/ws/rest/vehicle';

function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `sic_${prefix}_${parts.join('_')}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.expiry > Date.now()) return parsed.data as T;
      sessionStorage.removeItem(key);
    }
  } catch { /* ignore */ }
  return null;
}

function setCache<T>(key: string, data: T, ttlMs = 3600000): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
  } catch { /* ignore quota errors */ }
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// --- NHTSA vPIC API ---

export async function getAllMakes(): Promise<VehicleMake[]> {
  const cacheKey = getCacheKey('makes');
  const cached = getFromCache<VehicleMake[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${NHTSA_BASE}/GetAllMakes?format=json`);
    const data = await res.json();
    const makes: VehicleMake[] = (data.Results || []).map((r: { Make_ID: number; Make_Name: string }) => ({
      makeId: r.Make_ID,
      makeName: r.Make_Name,
    }));
    setCache(cacheKey, makes, 86400000); // 24h cache
    return makes;
  } catch {
    return [];
  }
}

export async function getModelsForMakeYear(make: string, year: number): Promise<VehicleModel[]> {
  const cacheKey = getCacheKey('models', make, year);
  const cached = getFromCache<VehicleModel[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `${NHTSA_BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    );
    const data = await res.json();
    const models: VehicleModel[] = (data.Results || []).map((r: { Model_ID: number; Model_Name: string }) => ({
      modelId: r.Model_ID,
      modelName: r.Model_Name,
    }));
    setCache(cacheKey, models);
    return models;
  } catch {
    return [];
  }
}

export async function decodeVin(vin: string): Promise<NHTSASpecs | null> {
  const cacheKey = getCacheKey('vin', vin);
  const cached = getFromCache<NHTSASpecs>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${NHTSA_BASE}/DecodeVinValues/${vin}?format=json`);
    const data = await res.json();
    const r = data.Results?.[0];
    if (!r) return null;

    const specs: NHTSASpecs = {
      make: r.Make || '',
      model: r.Model || '',
      modelYear: r.ModelYear || '',
      bodyClass: r.BodyClass || '',
      displacementCC: parseFloat(r.DisplacementCC) || 0,
      cylinders: parseInt(r.EngineCylinders) || 0,
      fuelType: r.FuelTypePrimary || '',
      driveType: r.DriveType || '',
      gvwr: r.GVWR || '',
      curbWeightLB: parseFloat(r.CurbWeightLB) || 0,
      plantCountry: r.PlantCountry || '',
    };
    setCache(cacheKey, specs);
    return specs;
  } catch {
    return null;
  }
}

// --- FuelEconomy.gov API (returns XML) ---

function parseXmlMenuItems(xmlText: string): { text: string; value: string }[] {
  const items: { text: string; value: string }[] = [];
  const regex = /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>\s*<\/menuItem>/g;
  let match;
  while ((match = regex.exec(xmlText)) !== null) {
    items.push({ text: match[1], value: match[2] });
  }
  return items;
}

export async function getFuelEcoMakes(year: number): Promise<string[]> {
  const cacheKey = getCacheKey('feco_makes', year);
  const cached = getFromCache<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${FUELECO_BASE}/menu/make?year=${year}`);
    const xml = await res.text();
    const makes = parseXmlMenuItems(xml).map(i => i.text);
    setCache(cacheKey, makes, 86400000);
    return makes;
  } catch {
    return [];
  }
}

export async function getFuelEcoModels(year: number, make: string): Promise<string[]> {
  const cacheKey = getCacheKey('feco_models', year, make);
  const cached = getFromCache<string[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `${FUELECO_BASE}/menu/model?year=${year}&make=${encodeURIComponent(make)}`
    );
    const xml = await res.text();
    const models = parseXmlMenuItems(xml).map(i => i.text);
    setCache(cacheKey, models);
    return models;
  } catch {
    return [];
  }
}

export async function getFuelEcoOptions(year: number, make: string, model: string): Promise<{ text: string; id: string }[]> {
  const cacheKey = getCacheKey('feco_opts', year, make, model);
  const cached = getFromCache<{ text: string; id: string }[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `${FUELECO_BASE}/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    );
    const xml = await res.text();
    const options = parseXmlMenuItems(xml).map(i => ({ text: i.text, id: i.value }));
    setCache(cacheKey, options);
    return options;
  } catch {
    return [];
  }
}

export async function getFuelEcoVehicle(id: string): Promise<FuelEcoVehicle | null> {
  const cacheKey = getCacheKey('feco_vehicle', id);
  const cached = getFromCache<FuelEcoVehicle>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(`${FUELECO_BASE}/${id}`);
    const xml = await res.text();

    const getTag = (tag: string): string => {
      const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1] : '';
    };

    const co2Gpm = parseFloat(getTag('co2TailpipeGpm')) || 0;
    const vehicle: FuelEcoVehicle = {
      id: parseInt(id),
      year: parseInt(getTag('year')) || 0,
      make: getTag('make'),
      model: getTag('model'),
      cylinders: parseInt(getTag('cylinders')) || 0,
      displ: parseFloat(getTag('displ')) || 0,
      fuelType: getTag('fuelType1'),
      co2TailpipeGpm: co2Gpm,
      co2_gkm: co2Gpm > 0 ? Math.round(co2Gpm / 1.60934) : 0,
      drive: getTag('drive'),
    };
    setCache(cacheKey, vehicle);
    return vehicle;
  } catch {
    return null;
  }
}
