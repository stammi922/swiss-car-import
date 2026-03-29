export interface CantonInfo {
  code: string;
  name: { de: string; en: string };
  mfkCost: number; // approximate MFK (Motorfahrzeugkontrolle) cost in CHF
  stvaUrl: string; // Strassenverkehrsamt URL
}

export const cantons: CantonInfo[] = [
  { code: 'ZH', name: { de: 'Zürich', en: 'Zurich' }, mfkCost: 80, stvaUrl: 'https://www.stva.zh.ch' },
  { code: 'BE', name: { de: 'Bern', en: 'Bern' }, mfkCost: 75, stvaUrl: 'https://www.svsa.be.ch' },
  { code: 'LU', name: { de: 'Luzern', en: 'Lucerne' }, mfkCost: 70, stvaUrl: 'https://strassenverkehr.lu.ch' },
  { code: 'UR', name: { de: 'Uri', en: 'Uri' }, mfkCost: 60, stvaUrl: 'https://www.ur.ch/dienstleistungen/3099' },
  { code: 'SZ', name: { de: 'Schwyz', en: 'Schwyz' }, mfkCost: 65, stvaUrl: 'https://www.sz.ch/verkehrsamt' },
  { code: 'OW', name: { de: 'Obwalden', en: 'Obwalden' }, mfkCost: 60, stvaUrl: 'https://www.ow.ch/dienstleistungen/4956' },
  { code: 'NW', name: { de: 'Nidwalden', en: 'Nidwalden' }, mfkCost: 60, stvaUrl: 'https://www.nw.ch/verkehr' },
  { code: 'GL', name: { de: 'Glarus', en: 'Glarus' }, mfkCost: 55, stvaUrl: 'https://www.gl.ch/verwaltung/sicherheit-und-justiz/strassenverkehrsamt.html' },
  { code: 'ZG', name: { de: 'Zug', en: 'Zug' }, mfkCost: 85, stvaUrl: 'https://www.zg.ch/behoerden/sicherheitsdirektion/strassenverkehrsamt' },
  { code: 'FR', name: { de: 'Freiburg', en: 'Fribourg' }, mfkCost: 70, stvaUrl: 'https://www.fr.ch/ocn' },
  { code: 'SO', name: { de: 'Solothurn', en: 'Solothurn' }, mfkCost: 65, stvaUrl: 'https://www.mvd.so.ch' },
  { code: 'BS', name: { de: 'Basel-Stadt', en: 'Basel-Stadt' }, mfkCost: 90, stvaUrl: 'https://www.mfa.bs.ch' },
  { code: 'BL', name: { de: 'Basel-Landschaft', en: 'Basel-Landschaft' }, mfkCost: 85, stvaUrl: 'https://www.baselland.ch/politik-und-behorden/direktionen/sicherheitsdirektion/motorfahrzeugkontrolle' },
  { code: 'SH', name: { de: 'Schaffhausen', en: 'Schaffhausen' }, mfkCost: 60, stvaUrl: 'https://sh.ch/strassenverkehrsamt' },
  { code: 'AR', name: { de: 'Appenzell Ausserrhoden', en: 'Appenzell Ausserrhoden' }, mfkCost: 55, stvaUrl: 'https://www.ar.ch/verwaltung/departement-volkswirtschaft-und-inneres/strassenverkehrsamt/' },
  { code: 'AI', name: { de: 'Appenzell Innerrhoden', en: 'Appenzell Innerrhoden' }, mfkCost: 50, stvaUrl: 'https://www.ai.ch/themen/sicherheit-und-justiz/strassenverkehrsamt' },
  { code: 'SG', name: { de: 'St. Gallen', en: 'St. Gallen' }, mfkCost: 75, stvaUrl: 'https://www.sg.ch/sicherheit/strassenverkehr-und-schifffahrt.html' },
  { code: 'GR', name: { de: 'Graubünden', en: 'Graubünden' }, mfkCost: 70, stvaUrl: 'https://www.stva.gr.ch' },
  { code: 'AG', name: { de: 'Aargau', en: 'Aargau' }, mfkCost: 75, stvaUrl: 'https://www.ag.ch/de/verwaltung/dvs/strassenverkehrsamt' },
  { code: 'TG', name: { de: 'Thurgau', en: 'Thurgau' }, mfkCost: 65, stvaUrl: 'https://strassenverkehrsamt.tg.ch' },
  { code: 'TI', name: { de: 'Tessin', en: 'Ticino' }, mfkCost: 80, stvaUrl: 'https://www4.ti.ch/di/sc/sezione-della-circolazione/sportello/' },
  { code: 'VD', name: { de: 'Waadt', en: 'Vaud' }, mfkCost: 90, stvaUrl: 'https://www.vd.ch/themes/mobilite/automobile/san' },
  { code: 'VS', name: { de: 'Wallis', en: 'Valais' }, mfkCost: 70, stvaUrl: 'https://www.vs.ch/web/scn' },
  { code: 'NE', name: { de: 'Neuenburg', en: 'Neuchâtel' }, mfkCost: 75, stvaUrl: 'https://www.ne.ch/autorites/DJSC/SCAN/' },
  { code: 'GE', name: { de: 'Genf', en: 'Geneva' }, mfkCost: 100, stvaUrl: 'https://www.ge.ch/connaitre-office-cantonal-vehicules' },
  { code: 'JU', name: { de: 'Jura', en: 'Jura' }, mfkCost: 65, stvaUrl: 'https://www.jura.ch/ocv' },
];

export function getCanton(code: string): CantonInfo | undefined {
  return cantons.find(c => c.code === code);
}
