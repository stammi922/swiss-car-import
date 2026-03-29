export interface ExchangeRates {
  CHF: number;
  EUR: number;
  USD: number;
  GBP: number;
  JPY: number;
  [key: string]: number;
}

export interface RateData {
  rates: ExchangeRates;
  date: string;
  source: string;
}

const FALLBACK_RATES: RateData = {
  rates: { CHF: 1, EUR: 0.93, USD: 0.88, GBP: 1.10, JPY: 0.0064 },
  date: '2026-03-28',
  source: 'fallback',
};

export async function fetchExchangeRates(): Promise<RateData> {
  try {
    // Use frankfurter.app (free, no API key needed, ECB data)
    const res = await fetch(
      'https://api.frankfurter.app/latest?to=CHF&from=EUR,USD,GBP,JPY',
      { next: { revalidate: 3600 } } // cache for 1 hour
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // data.rates contains: { CHF: x } for each base currency
    // We need rates as "1 unit of currency X = Y CHF"
    const rates: ExchangeRates = {
      CHF: 1,
      EUR: data.rates?.CHF || FALLBACK_RATES.rates.EUR,
      USD: 0,
      GBP: 0,
      JPY: 0,
    };

    // Fetch individual rates
    const [usdRes, gbpRes, jpyRes] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=USD&to=CHF', { next: { revalidate: 3600 } }),
      fetch('https://api.frankfurter.app/latest?from=GBP&to=CHF', { next: { revalidate: 3600 } }),
      fetch('https://api.frankfurter.app/latest?from=JPY&to=CHF', { next: { revalidate: 3600 } }),
    ]);

    if (usdRes.ok) {
      const usdData = await usdRes.json();
      rates.USD = usdData.rates?.CHF || FALLBACK_RATES.rates.USD;
    }
    if (gbpRes.ok) {
      const gbpData = await gbpRes.json();
      rates.GBP = gbpData.rates?.CHF || FALLBACK_RATES.rates.GBP;
    }
    if (jpyRes.ok) {
      const jpyData = await jpyRes.json();
      rates.JPY = jpyData.rates?.CHF || FALLBACK_RATES.rates.JPY;
    }

    return {
      rates,
      date: data.date || new Date().toISOString().split('T')[0],
      source: 'frankfurter.app (ECB)',
    };
  } catch {
    return FALLBACK_RATES;
  }
}

export function convertToCHF(amount: number, currency: string, rates: ExchangeRates): number {
  if (currency === 'CHF') return amount;
  const rate = rates[currency];
  if (!rate) return amount; // fallback: assume 1:1
  return Math.round(amount * rate);
}
