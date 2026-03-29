import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { WizardData } from '@/lib/store';
import type { CostBreakdown } from '@/lib/calculator';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  redBar: { width: 40, height: 3, backgroundColor: '#FF0000', marginBottom: 12 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#6b7280', marginBottom: 20 },
  stepGroup: { marginBottom: 16 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF0000', color: '#ffffff', textAlign: 'center', lineHeight: 24, fontFamily: 'Helvetica-Bold', fontSize: 11, marginRight: 8 },
  stepTitle: { fontFamily: 'Helvetica-Bold', fontSize: 13, color: '#1a1a1a' },
  checkItem: { flexDirection: 'row', marginBottom: 6, paddingLeft: 32 },
  checkbox: { width: 12, height: 12, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 2, marginRight: 8, marginTop: 1 },
  checkText: { flex: 1, lineHeight: 1.4 },
  note: { paddingLeft: 52, fontSize: 9, color: '#6b7280', marginBottom: 4, fontStyle: 'italic' },
  divider: { borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', marginVertical: 12 },
  disclaimer: { fontSize: 8, color: '#9ca3af', marginTop: 24, textAlign: 'center' },
});

interface Props {
  data: WizardData;
  results: CostBreakdown;
  locale: 'de' | 'en';
}

interface Step {
  title: string;
  items: string[];
  notes?: string[];
}

export function ChecklistPdf({ data, results, locale }: Props) {
  const de = locale === 'de';

  const steps: Step[] = de
    ? [
        {
          title: 'Vor dem Kauf',
          items: [
            'Fahrzeugdaten prüfen (Leergewicht, CO2, Erstregistrierung)',
            'Schweizer Marktpreis recherchieren (für Verzollungswert)',
            'EUR.1 / Ursprungsnachweis beim Verkäufer anfragen',
            'COC (Certificate of Conformity) sicherstellen',
            'Importkosten mit diesem Rechner kalkulieren',
          ],
        },
        {
          title: 'Kaufabwicklung',
          items: [
            'Kaufvertrag unterzeichnen',
            'Zahlungsbeleg aufbewahren',
            'Fahrzeugbrief / Zulassungsbescheinigung erhalten',
            data.transportMethod === 'self' ? 'Ausfuhrkennzeichen besorgen' : 'Spedition beauftragen',
            'Fahrzeug versichern (Mindesthaftpflicht für Überführung)',
          ],
        },
        {
          title: 'Grenzübertritt / Verzollung',
          items: [
            'Alle Dokumente bereithalten: Kaufvertrag, Ausweis, Fahrzeugpapiere',
            results.requiredForms.filter((f) => f.userFills).map((f) => `Formular ${f.id} ausgefüllt mitbringen`).join(', ') || 'Keine Formulare zum Ausfüllen',
            'Am Zoll anmelden (Werktags 7-17 Uhr empfohlen)',
            'Zollabfertigung durchführen lassen',
            'Formular 13.20A (Zollabfertigungsbescheinigung) erhalten — CHF 20',
            `Zoll bezahlen: CHF ${results.customsDuty + results.automobileTax + results.vat}`,
          ],
          notes: results.isRelocationFree
            ? ['Übersiedlungsgut: Zollbefreiung mit Form 18.44 beantragen']
            : undefined,
        },
        {
          title: 'Nach der Verzollung',
          items: [
            'Abgaswartung (Emissionstest) durchführen lassen — ca. CHF 100',
            'MFK-Termin beim kantonalen Strassenverkehrsamt vereinbaren',
            'MFK durchführen lassen — ca. CHF ' + results.mfk,
            'Fahrzeug bei der Versicherung anmelden',
          ],
        },
        {
          title: 'Zulassung im Kanton',
          items: [
            'Strassenverkehrsamt besuchen mit: 13.20A, MFK-Bericht, Versicherungsnachweis, Ausweis',
            'Kontrollschilder erhalten',
            'Fahrzeugausweis erhalten',
            'Fahrzeug ist zugelassen — fertig!',
          ],
        },
      ]
    : [
        {
          title: 'Before Purchase',
          items: [
            'Check vehicle data (empty weight, CO2, first registration)',
            'Research Swiss market price (for customs valuation)',
            'Request EUR.1 / proof of origin from seller',
            'Ensure COC (Certificate of Conformity) is available',
            'Calculate import costs using this calculator',
          ],
        },
        {
          title: 'Purchase Process',
          items: [
            'Sign purchase contract',
            'Keep payment receipts',
            'Receive vehicle registration document',
            data.transportMethod === 'self' ? 'Obtain export plates' : 'Commission logistics company',
            'Insure vehicle (minimum liability for transfer)',
          ],
        },
        {
          title: 'Border Crossing / Customs',
          items: [
            'Have all documents ready: contract, ID, vehicle papers',
            results.requiredForms.filter((f) => f.userFills).map((f) => `Bring completed form ${f.id}`).join(', ') || 'No forms to fill in',
            'Register at customs (weekdays 7-17h recommended)',
            'Complete customs clearance',
            'Receive Form 13.20A (customs clearance certificate) — CHF 20',
            `Pay duties: CHF ${results.customsDuty + results.automobileTax + results.vat}`,
          ],
          notes: results.isRelocationFree
            ? ['Household effects: Apply for duty exemption with Form 18.44']
            : undefined,
        },
        {
          title: 'After Customs',
          items: [
            'Complete emission test — approx. CHF 100',
            'Schedule MFK appointment at cantonal road traffic office',
            'Complete MFK — approx. CHF ' + results.mfk,
            'Register vehicle with insurance company',
          ],
        },
        {
          title: 'Cantonal Registration',
          items: [
            'Visit road traffic office with: 13.20A, MFK report, insurance proof, ID',
            'Receive license plates',
            'Receive vehicle registration document',
            'Vehicle is registered — done!',
          ],
        },
      ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.redBar} />
        <Text style={styles.title}>
          {de ? 'Import-Checkliste' : 'Import Checklist'}
        </Text>
        <Text style={styles.subtitle}>
          {data.vehicleMake} {data.vehicleModel} ({data.vehicleYear}) —{' '}
          {new Date().toLocaleDateString(de ? 'de-CH' : 'en-GB')}
        </Text>

        {steps.map((step, si) => (
          <View key={si} style={styles.stepGroup}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{si + 1}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            {step.items.map((item, ii) => (
              <View key={ii} style={styles.checkItem}>
                <View style={styles.checkbox} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
            {step.notes?.map((note, ni) => (
              <Text key={ni} style={styles.note}>
                {note}
              </Text>
            ))}
            {si < steps.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        <Text style={styles.disclaimer}>
          {de
            ? 'Erstellt mit Swiss Car Import Calculator. Alle Angaben ohne Gewähr.'
            : 'Generated by Swiss Car Import Calculator. All information without guarantee.'}
        </Text>
      </Page>
    </Document>
  );
}
