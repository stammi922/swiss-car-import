export interface Country {
  code: string;
  name: { de: string; en: string };
  isEU: boolean;
  isFTA: boolean; // Free Trade Agreement with Switzerland (via EFTA)
  flag: string;
}

export const countries: Country[] = [
  // EU countries
  { code: 'DE', name: { de: 'Deutschland', en: 'Germany' }, isEU: true, isFTA: false, flag: '🇩🇪' },
  { code: 'AT', name: { de: 'Österreich', en: 'Austria' }, isEU: true, isFTA: false, flag: '🇦🇹' },
  { code: 'IT', name: { de: 'Italien', en: 'Italy' }, isEU: true, isFTA: false, flag: '🇮🇹' },
  { code: 'FR', name: { de: 'Frankreich', en: 'France' }, isEU: true, isFTA: false, flag: '🇫🇷' },
  { code: 'NL', name: { de: 'Niederlande', en: 'Netherlands' }, isEU: true, isFTA: false, flag: '🇳🇱' },
  { code: 'BE', name: { de: 'Belgien', en: 'Belgium' }, isEU: true, isFTA: false, flag: '🇧🇪' },
  { code: 'ES', name: { de: 'Spanien', en: 'Spain' }, isEU: true, isFTA: false, flag: '🇪🇸' },
  { code: 'PT', name: { de: 'Portugal', en: 'Portugal' }, isEU: true, isFTA: false, flag: '🇵🇹' },
  { code: 'PL', name: { de: 'Polen', en: 'Poland' }, isEU: true, isFTA: false, flag: '🇵🇱' },
  { code: 'CZ', name: { de: 'Tschechien', en: 'Czech Republic' }, isEU: true, isFTA: false, flag: '🇨🇿' },
  { code: 'SE', name: { de: 'Schweden', en: 'Sweden' }, isEU: true, isFTA: false, flag: '🇸🇪' },
  { code: 'DK', name: { de: 'Dänemark', en: 'Denmark' }, isEU: true, isFTA: false, flag: '🇩🇰' },
  { code: 'FI', name: { de: 'Finnland', en: 'Finland' }, isEU: true, isFTA: false, flag: '🇫🇮' },
  { code: 'IE', name: { de: 'Irland', en: 'Ireland' }, isEU: true, isFTA: false, flag: '🇮🇪' },
  { code: 'RO', name: { de: 'Rumänien', en: 'Romania' }, isEU: true, isFTA: false, flag: '🇷🇴' },
  { code: 'BG', name: { de: 'Bulgarien', en: 'Bulgaria' }, isEU: true, isFTA: false, flag: '🇧🇬' },
  { code: 'HU', name: { de: 'Ungarn', en: 'Hungary' }, isEU: true, isFTA: false, flag: '🇭🇺' },
  { code: 'HR', name: { de: 'Kroatien', en: 'Croatia' }, isEU: true, isFTA: false, flag: '🇭🇷' },
  { code: 'SK', name: { de: 'Slowakei', en: 'Slovakia' }, isEU: true, isFTA: false, flag: '🇸🇰' },
  { code: 'SI', name: { de: 'Slowenien', en: 'Slovenia' }, isEU: true, isFTA: false, flag: '🇸🇮' },
  { code: 'LT', name: { de: 'Litauen', en: 'Lithuania' }, isEU: true, isFTA: false, flag: '🇱🇹' },
  { code: 'LV', name: { de: 'Lettland', en: 'Latvia' }, isEU: true, isFTA: false, flag: '🇱🇻' },
  { code: 'EE', name: { de: 'Estland', en: 'Estonia' }, isEU: true, isFTA: false, flag: '🇪🇪' },
  { code: 'GR', name: { de: 'Griechenland', en: 'Greece' }, isEU: true, isFTA: false, flag: '🇬🇷' },
  { code: 'LU', name: { de: 'Luxemburg', en: 'Luxembourg' }, isEU: true, isFTA: false, flag: '🇱🇺' },
  { code: 'CY', name: { de: 'Zypern', en: 'Cyprus' }, isEU: true, isFTA: false, flag: '🇨🇾' },
  { code: 'MT', name: { de: 'Malta', en: 'Malta' }, isEU: true, isFTA: false, flag: '🇲🇹' },
  // EFTA (non-EU, but FTA)
  { code: 'NO', name: { de: 'Norwegen', en: 'Norway' }, isEU: false, isFTA: true, flag: '🇳🇴' },
  { code: 'IS', name: { de: 'Island', en: 'Iceland' }, isEU: false, isFTA: true, flag: '🇮🇸' },
  { code: 'LI', name: { de: 'Liechtenstein', en: 'Liechtenstein' }, isEU: false, isFTA: true, flag: '🇱🇮' },
  // FTA countries (Switzerland has FTA via EFTA)
  { code: 'GB', name: { de: 'Vereinigtes Königreich', en: 'United Kingdom' }, isEU: false, isFTA: true, flag: '🇬🇧' },
  { code: 'JP', name: { de: 'Japan', en: 'Japan' }, isEU: false, isFTA: true, flag: '🇯🇵' },
  { code: 'KR', name: { de: 'Südkorea', en: 'South Korea' }, isEU: false, isFTA: true, flag: '🇰🇷' },
  { code: 'CA', name: { de: 'Kanada', en: 'Canada' }, isEU: false, isFTA: true, flag: '🇨🇦' },
  { code: 'MX', name: { de: 'Mexiko', en: 'Mexico' }, isEU: false, isFTA: true, flag: '🇲🇽' },
  { code: 'TR', name: { de: 'Türkei', en: 'Turkey' }, isEU: false, isFTA: true, flag: '🇹🇷' },
  // Non-FTA
  { code: 'US', name: { de: 'USA', en: 'United States' }, isEU: false, isFTA: false, flag: '🇺🇸' },
  { code: 'CN', name: { de: 'China', en: 'China' }, isEU: false, isFTA: false, flag: '🇨🇳' },
  { code: 'IN', name: { de: 'Indien', en: 'India' }, isEU: false, isFTA: false, flag: '🇮🇳' },
  { code: 'AE', name: { de: 'VAE', en: 'UAE' }, isEU: false, isFTA: true, flag: '🇦🇪' },
  { code: 'AU', name: { de: 'Australien', en: 'Australia' }, isEU: false, isFTA: false, flag: '🇦🇺' },
  { code: 'BR', name: { de: 'Brasilien', en: 'Brazil' }, isEU: false, isFTA: false, flag: '🇧🇷' },
  { code: 'ZA', name: { de: 'Südafrika', en: 'South Africa' }, isEU: false, isFTA: true, flag: '🇿🇦' },
  { code: 'TH', name: { de: 'Thailand', en: 'Thailand' }, isEU: false, isFTA: false, flag: '🇹🇭' },
  { code: 'RU', name: { de: 'Russland', en: 'Russia' }, isEU: false, isFTA: false, flag: '🇷🇺' },
];

export function getCountry(code: string): Country | undefined {
  return countries.find(c => c.code === code);
}

export function isDutyFree(country: Country, hasEUR1: boolean): boolean {
  if (country.isEU && hasEUR1) return true;
  if (country.isFTA && hasEUR1) return true;
  return false;
}
