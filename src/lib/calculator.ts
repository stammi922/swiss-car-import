import { getCountry, isDutyFree } from './countries';
import { getCanton } from './cantonData';

export type ImportType = 'standard' | 'relocation' | 'inheritance' | 'marriage' | 'temporary';
export type TransportMethod = 'self' | 'logistics' | 'trailer';

export interface ImportInput {
  vehicleWeight: number;        // kg (empty weight)
  co2Emissions: number;         // g/km WLTP
  purchasePrice: number;        // in original currency
  purchaseCurrency: string;     // EUR, USD, GBP, JPY, CHF
  vehicleValueCHF: number;      // value in CHF (for customs/tax basis)
  originCountry: string;        // ISO code
  hasProofOfOrigin: boolean;    // EUR.1 or supplier's declaration
  importType: ImportType;
  firstRegistrationDate: string; // ISO date string
  vehicleKm: number;
  transportMethod: TransportMethod;
  canton: string;
  ownershipMonths: number;      // how long owned before import
  transportCostCHF: number;     // user-estimated transport cost
}

export interface CostBreakdown {
  customsDuty: number;
  automobileTax: number;
  vat: number;
  co2Sanction: number;
  co2SanctionNote: string;
  customsCertificate: number;
  emissionTest: number;
  mfk: number;
  transportCost: number;
  exportPlates: number;
  totalImportCosts: number;
  totalWithVehicle: number;
  vatBasis: number;
  isDutyFree: boolean;
  isRelocationFree: boolean;
  isCO2Exempt: boolean;
  requiredForms: FormInfo[];
}

export interface FormInfo {
  id: string;
  name: { de: string; en: string };
  description: { de: string; en: string };
  url?: string;
  userFills: boolean; // true = user fills, false = issued by customs
}

const CUSTOMS_DUTY_PER_100KG = 15; // CHF per 100kg
const AUTOMOBILE_TAX_RATE = 0.04;  // 4%
const VAT_RATE = 0.081;            // 8.1%
const CUSTOMS_CERTIFICATE_FEE = 20; // CHF
const EMISSION_TEST_COST = 100;     // CHF approx
const EXPORT_PLATES_COST = 80;      // CHF approx (EUR ~75)

export function calculateImportCosts(input: ImportInput): CostBreakdown {
  const country = getCountry(input.originCountry);
  const canton = getCanton(input.canton);

  // 1. Determine if relocation (Übersiedlungsgut) applies
  const isRelocationFree = 
    (input.importType === 'relocation' && input.ownershipMonths >= 6) ||
    input.importType === 'inheritance' ||
    input.importType === 'marriage';

  // 2. Customs Duty
  let customsDuty = 0;
  let dutyFree = false;
  
  if (isRelocationFree || input.importType === 'temporary') {
    dutyFree = true;
    customsDuty = 0;
  } else if (country && isDutyFree(country, input.hasProofOfOrigin)) {
    dutyFree = true;
    customsDuty = 0;
  } else {
    customsDuty = Math.round((input.vehicleWeight / 100) * CUSTOMS_DUTY_PER_100KG);
  }

  // 3. Automobile Tax (4% of vehicle value) — always for standard, not for relocation/temporary
  let automobileTax = 0;
  if (!isRelocationFree && input.importType !== 'temporary') {
    automobileTax = Math.round(input.vehicleValueCHF * AUTOMOBILE_TAX_RATE);
  }

  // 4. Transport cost
  const transportCost = input.transportCostCHF || estimateTransportCost(input);

  // 5. VAT (8.1% of everything: price + duty + auto tax + transport)
  let vat = 0;
  let vatBasis = 0;
  if (!isRelocationFree && input.importType !== 'temporary') {
    vatBasis = input.vehicleValueCHF + customsDuty + automobileTax + transportCost;
    vat = Math.round(vatBasis * VAT_RATE);
  }

  // 6. CO2 Sanction check
  const { co2Sanction, co2SanctionNote, isCO2Exempt } = calculateCO2Sanction(input);

  // 7. Registration costs
  const mfk = canton?.mfkCost || 75;
  const emissionTest = EMISSION_TEST_COST;
  const customsCertificate = input.importType === 'temporary' ? 0 : CUSTOMS_CERTIFICATE_FEE;
  const exportPlates = input.transportMethod === 'self' ? EXPORT_PLATES_COST : 0;

  // 8. Required forms
  const requiredForms = getRequiredForms(input);

  // Totals
  const totalImportCosts = customsDuty + automobileTax + vat + co2Sanction +
    customsCertificate + emissionTest + mfk + transportCost + exportPlates;
  const totalWithVehicle = input.vehicleValueCHF + totalImportCosts;

  return {
    customsDuty,
    automobileTax,
    vat,
    co2Sanction,
    co2SanctionNote,
    customsCertificate,
    emissionTest,
    mfk,
    transportCost,
    exportPlates,
    totalImportCosts,
    totalWithVehicle,
    vatBasis,
    isDutyFree: dutyFree,
    isRelocationFree,
    isCO2Exempt,
    requiredForms,
  };
}

function estimateTransportCost(input: ImportInput): number {
  if (input.transportMethod === 'self') return 200; // fuel + tolls estimate
  if (input.transportMethod === 'trailer') return 150;
  // Logistics estimate based on origin
  const country = getCountry(input.originCountry);
  if (!country) return 1500;
  if (country.isEU) return 800;
  if (['US', 'CA'].includes(input.originCountry)) return 2500;
  if (['JP', 'KR', 'CN', 'TH'].includes(input.originCountry)) return 3500;
  return 2000;
}

function calculateCO2Sanction(input: ImportInput): {
  co2Sanction: number;
  co2SanctionNote: string;
  isCO2Exempt: boolean;
} {
  if (input.importType === 'temporary') {
    return { co2Sanction: 0, co2SanctionNote: '', isCO2Exempt: true };
  }

  const firstRegDate = new Date(input.firstRegistrationDate);
  const now = new Date();
  const monthsSinceReg = (now.getFullYear() - firstRegDate.getFullYear()) * 12 +
    (now.getMonth() - firstRegDate.getMonth());

  // Exempt if registered abroad >= 6 months ago
  // OR registered >= 12 months ago with >= 5000km
  if (monthsSinceReg >= 6) {
    return {
      co2Sanction: 0,
      co2SanctionNote: 'exempt_over_6_months',
      isCO2Exempt: true,
    };
  }

  if (monthsSinceReg >= 12 && input.vehicleKm >= 5000) {
    return {
      co2Sanction: 0,
      co2SanctionNote: 'exempt_over_12_months_5000km',
      isCO2Exempt: true,
    };
  }

  // Vehicle may be subject to CO2 sanction
  // Rough estimate: 2025 target ~122 g/km for average car (1740kg reference)
  // Sanction = (actual - target) * CHF ~100-160 per g/km (very rough)
  const co2Target = 118; // 2025/2026 approximate target for average car
  if (input.co2Emissions <= co2Target) {
    return {
      co2Sanction: 0,
      co2SanctionNote: 'below_target',
      isCO2Exempt: true,
    };
  }

  const excess = input.co2Emissions - co2Target;
  // Simplified penalty tiers
  let sanction = 0;
  if (excess <= 3) {
    sanction = excess * 5; // CHF 5/g for first 3g over
  } else if (excess <= 6) {
    sanction = 15 + (excess - 3) * 25; // CHF 25/g for 4-6g over
  } else {
    sanction = 15 + 75 + (excess - 6) * 100; // CHF 100/g for >6g over
  }

  return {
    co2Sanction: Math.round(sanction),
    co2SanctionNote: 'subject_to_co2_sanction',
    isCO2Exempt: false,
  };
}

function getRequiredForms(input: ImportInput): FormInfo[] {
  const forms: FormInfo[] = [];

  // Always need e-dec (electronic customs declaration)
  forms.push({
    id: 'e-dec',
    name: { de: 'e-dec Web', en: 'e-dec Web' },
    description: {
      de: 'Elektronische Zollanmeldung für den Import',
      en: 'Electronic customs declaration for import',
    },
    url: 'https://e-dec.admin.ch',
    userFills: true,
  });

  // EUR.1 if applicable
  if (input.hasProofOfOrigin) {
    forms.push({
      id: 'eur1',
      name: { de: 'EUR.1 / Lieferantenerklärung', en: 'EUR.1 / Supplier Declaration' },
      description: {
        de: 'Präferenznachweis für zollfreie Einfuhr aus EU/FTA-Ländern',
        en: 'Proof of preferential origin for duty-free import from EU/FTA countries',
      },
      userFills: false,
    });
  }

  // Import type specific forms
  switch (input.importType) {
    case 'relocation':
      forms.push({
        id: '18.44',
        name: { de: 'Formular 18.44', en: 'Form 18.44' },
        description: {
          de: 'Zollbefreiung für Übersiedlungsgut (Fahrzeug muss mind. 6 Monate in Ihrem Besitz sein)',
          en: 'Customs exemption for household effects (vehicle must be owned for min. 6 months)',
        },
        url: 'https://www.bazg.admin.ch/bazg/de/home/information-firmen/zollanmeldung---zollverfahren/einfuhr-in-die-schweiz/uebersiedlungsgut.html',
        userFills: true,
      });
      break;
    case 'marriage':
      forms.push({
        id: '18.45',
        name: { de: 'Formular 18.45', en: 'Form 18.45' },
        description: {
          de: 'Zollbefreiung für Heiratsgut',
          en: 'Customs exemption for wedding trousseau',
        },
        userFills: true,
      });
      break;
    case 'inheritance':
      forms.push({
        id: '18.46',
        name: { de: 'Formular 18.46', en: 'Form 18.46' },
        description: {
          de: 'Zollbefreiung für Erbschaftsgut',
          en: 'Customs exemption for inherited goods',
        },
        userFills: true,
      });
      break;
    case 'temporary':
      forms.push({
        id: '13.20',
        name: { de: 'Formular 13.20', en: 'Form 13.20' },
        description: {
          de: 'Vorübergehende Verwendung (max. 12 Monate)',
          en: 'Temporary admission (max. 12 months)',
        },
        userFills: true,
      });
      break;
  }

  // 13.20A — issued BY customs (not user-filled)
  if (input.importType !== 'temporary') {
    forms.push({
      id: '13.20A',
      name: { de: 'Formular 13.20A', en: 'Form 13.20A' },
      description: {
        de: 'Zollabfertigungsbescheinigung — wird vom Zoll AUSGESTELLT (nicht selbst ausfüllen)',
        en: 'Customs clearance certificate — ISSUED by customs (you don\'t fill this in)',
      },
      userFills: false,
    });
  }

  return forms;
}
