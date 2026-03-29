import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { WizardData } from '@/lib/store';
import type { CostBreakdown } from '@/lib/calculator';
import { getCanton } from '@/lib/cantonData';
import { getCountry } from '@/lib/countries';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' },
  subtitle: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  redBar: { width: 40, height: 3, backgroundColor: '#FF0000', marginBottom: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  rowLabel: { flex: 1 },
  rowAmount: { fontFamily: 'Helvetica-Bold', textAlign: 'right', width: 100 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1.5, borderTopColor: '#1a1a1a', marginTop: 8 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 12 },
  totalAmount: { fontFamily: 'Helvetica-Bold', fontSize: 12, textAlign: 'right', width: 100, color: '#FF0000' },
  vehicleBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 4, marginBottom: 16 },
  vehicleTitle: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#1a1a1a' },
  vehicleDetail: { color: '#6b7280', marginTop: 2 },
  greenText: { color: '#15803d' },
  note: { fontSize: 8, color: '#9ca3af', marginTop: 4 },
  disclaimer: { fontSize: 8, color: '#9ca3af', marginTop: 24, textAlign: 'center' },
});

function fmt(n: number) {
  return `CHF ${n.toLocaleString('de-CH')}`;
}

interface Props {
  data: WizardData;
  results: CostBreakdown;
  locale: 'de' | 'en';
}

export function CostBreakdownPdf({ data, results, locale }: Props) {
  const de = locale === 'de';
  const canton = getCanton(data.canton);
  const country = getCountry(data.originCountry);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.redBar} />
          <Text style={styles.title}>
            {de ? 'Kostenübersicht Fahrzeugimport' : 'Vehicle Import Cost Summary'}
          </Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString(de ? 'de-CH' : 'en-GB')}
          </Text>
        </View>

        {/* Vehicle info */}
        <View style={styles.vehicleBox}>
          <Text style={styles.vehicleTitle}>
            {data.vehicleMake} {data.vehicleModel} ({data.vehicleYear})
          </Text>
          <Text style={styles.vehicleDetail}>
            {country?.name[locale] || data.originCountry} | {data.vehicleWeight} kg | {data.co2Emissions} g/km CO₂ | {canton?.name[locale] || data.canton}
          </Text>
          {(data.vehicleMake || data.vehicleModel) && (
            <Text style={[styles.vehicleDetail, { fontSize: 9, marginTop: 4 }]}>
              {de ? 'Fahrzeugdaten aus Datenbank oder manueller Eingabe.' : 'Vehicle data from database or manual entry.'}
            </Text>
          )}
        </View>

        {/* Vehicle price */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { fontFamily: 'Helvetica-Bold' }]}>
              {de ? 'Fahrzeugpreis' : 'Vehicle price'}
            </Text>
            <Text style={styles.rowAmount}>{fmt(data.vehicleValueCHF)}</Text>
          </View>
        </View>

        {/* Government fees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {de ? 'Staatliche Abgaben' : 'Government Fees'}
          </Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, results.isDutyFree ? styles.greenText : {}]}>
              {de ? 'Zoll' : 'Customs duty'}
              {results.isDutyFree ? (de ? ' (zollfrei)' : ' (duty-free)') : ''}
            </Text>
            <Text style={[styles.rowAmount, results.isDutyFree ? styles.greenText : {}]}>
              {fmt(results.customsDuty)}
            </Text>
          </View>

          {results.automobileTax > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{de ? 'Automobilsteuer (4%)' : 'Automobile tax (4%)'}</Text>
              <Text style={styles.rowAmount}>{fmt(results.automobileTax)}</Text>
            </View>
          )}

          {results.vat > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{de ? 'MWST (8.1%)' : 'VAT (8.1%)'}</Text>
              <Text style={styles.rowAmount}>{fmt(results.vat)}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={[styles.rowLabel, results.isCO2Exempt ? styles.greenText : {}]}>
              {de ? 'CO2-Sanktion' : 'CO2 sanction'}
              {results.isCO2Exempt ? (de ? ' (befreit)' : ' (exempt)') : ''}
            </Text>
            <Text style={[styles.rowAmount, results.isCO2Exempt ? styles.greenText : {}]}>
              {fmt(results.co2Sanction)}
            </Text>
          </View>

          {results.customsCertificate > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{de ? 'Zollabfertigungsbescheinigung' : 'Customs clearance cert.'}</Text>
              <Text style={styles.rowAmount}>{fmt(results.customsCertificate)}</Text>
            </View>
          )}
        </View>

        {/* Transport */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {de ? 'Transport & Logistik' : 'Transport & Logistics'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{de ? 'Transport' : 'Transport'}</Text>
            <Text style={styles.rowAmount}>{fmt(results.transportCost)}</Text>
          </View>
          {results.exportPlates > 0 && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{de ? 'Ausfuhrkennzeichen' : 'Export plates'}</Text>
              <Text style={styles.rowAmount}>{fmt(results.exportPlates)}</Text>
            </View>
          )}
        </View>

        {/* Registration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {de ? 'Zulassung' : 'Registration'}
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{de ? 'Abgaswartung' : 'Emission test'}</Text>
            <Text style={styles.rowAmount}>{fmt(results.emissionTest)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>MFK ({canton?.name[locale]})</Text>
            <Text style={styles.rowAmount}>{fmt(results.mfk)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{de ? 'Importkosten Total' : 'Total import costs'}</Text>
          <Text style={[styles.totalAmount, { color: '#1a1a1a' }]}>{fmt(results.totalImportCosts)}</Text>
        </View>
        <View style={[styles.totalRow, { borderTopColor: '#FF0000' }]}>
          <Text style={styles.totalLabel}>{de ? 'Gesamtkosten inkl. Fahrzeug' : 'Total incl. vehicle'}</Text>
          <Text style={styles.totalAmount}>{fmt(results.totalWithVehicle)}</Text>
        </View>

        {/* Forms */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>{de ? 'Benötigte Formulare' : 'Required Forms'}</Text>
          {results.requiredForms.map((f) => (
            <View key={f.id} style={styles.row}>
              <Text style={styles.rowLabel}>
                {f.name[locale]} — {f.description[locale]}
              </Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          {de
            ? 'Alle Angaben ohne Gewähr. CO2-Sanktion ist eine Schätzung. Verbindliche Informationen: bazg.admin.ch'
            : 'All information without guarantee. CO2 sanction is an estimate. Official information: bazg.admin.ch'}
        </Text>
      </Page>
    </Document>
  );
}
