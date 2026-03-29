'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWizard } from '@/lib/store';
import { calculateImportCosts, type CostBreakdown } from '@/lib/calculator';
import { getCanton } from '@/lib/cantonData';
import { getCountry } from '@/lib/countries';
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const PdfDownloadButton = dynamic(() => import('@/components/pdf/PdfDownloadButton'), {
  ssr: false,
  loading: () => (
    <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 text-gray-500 text-sm">
      <Download className="w-4 h-4" /> Loading...
    </button>
  ),
});

function formatCHF(amount: number): string {
  return `CHF ${amount.toLocaleString('de-CH')}`;
}

interface CostRowProps {
  label: string;
  amount: number;
  note?: string;
  bold?: boolean;
  red?: boolean;
  green?: boolean;
}

function CostRow({ label, amount, note, bold, red, green }: CostRowProps) {
  return (
    <div className={`flex justify-between items-baseline py-2 ${bold ? 'font-bold' : ''}`}>
      <div className="flex-1">
        <span className={red ? 'text-swiss-red' : green ? 'text-green-700' : ''}>{label}</span>
        {note && <span className="text-xs text-gray-500 ml-2">({note})</span>}
      </div>
      <span className={`font-mono text-right ${bold ? 'text-lg' : ''} ${red ? 'text-swiss-red' : ''}`}>
        {formatCHF(amount)}
      </span>
    </div>
  );
}

export default function ResultsStep() {
  const t = useTranslations('results');
  const locale = useLocale() as 'de' | 'en';
  const { data, setCurrentStep } = useWizard();
  const [showProviders, setShowProviders] = useState(false);
  const [providers, setProviders] = useState<{ title: string; url: string; desc: string }[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const results: CostBreakdown = useMemo(
    () =>
      calculateImportCosts({
        vehicleWeight: data.vehicleWeight,
        co2Emissions: data.co2Emissions,
        purchasePrice: data.purchasePrice,
        purchaseCurrency: data.purchaseCurrency,
        vehicleValueCHF: data.vehicleValueCHF,
        originCountry: data.originCountry,
        hasProofOfOrigin: data.hasProofOfOrigin,
        importType: data.importType,
        firstRegistrationDate: data.firstRegistrationDate,
        vehicleKm: data.vehicleKm,
        transportMethod: data.transportMethod,
        canton: data.canton,
        ownershipMonths: data.ownershipMonths,
        transportCostCHF: data.transportCostCHF,
      }),
    [data]
  );

  const canton = getCanton(data.canton);
  const country = getCountry(data.originCountry);

  const searchProviders = async () => {
    setLoadingProviders(true);
    setShowProviders(true);
    try {
      const cantonName = canton?.name[locale] || data.canton;
      const query =
        locale === 'de'
          ? `Zollagent Fahrzeugimport ${cantonName} Schweiz`
          : `customs agent vehicle import ${cantonName} Switzerland`;
      const res = await fetch(`/api/providers?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        setProviders(json.results || []);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingProviders(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>
        <button
          onClick={() => setCurrentStep(0)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-swiss-red transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          {t('new_calculation')}
        </button>
      </div>

      {/* Vehicle summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <p className="font-semibold text-dark">
          {data.vehicleMake} {data.vehicleModel} ({data.vehicleYear})
        </p>
        <p className="text-gray-600">
          {country?.flag} {country?.name[locale]} | {data.vehicleWeight} kg | {data.co2Emissions} g/km CO₂
        </p>
      </div>

      {/* Cost breakdown */}
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {/* Vehicle price */}
        <div className="p-4">
          <CostRow label={t('vehicle_cost')} amount={data.vehicleValueCHF} bold />
        </div>

        {/* Government fees */}
        <div className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {t('government_fees')}
          </p>

          {/* Customs duty */}
          {results.isDutyFree ? (
            <div className="flex justify-between items-baseline py-2">
              <span className="text-green-700">
                {results.isRelocationFree ? t('customs_duty_relocation') : t('customs_duty_free')}
              </span>
              <span className="font-mono text-green-700">CHF 0</span>
            </div>
          ) : (
            <CostRow label={t('customs_duty')} amount={results.customsDuty} note={`${data.vehicleWeight} kg`} />
          )}

          {/* Auto tax */}
          {results.automobileTax > 0 && (
            <CostRow label={t('automobile_tax')} amount={results.automobileTax} />
          )}

          {/* VAT */}
          {results.vat > 0 && (
            <CostRow label={t('vat')} amount={results.vat} note={`${t('vat_basis')}: ${formatCHF(results.vatBasis)}`} />
          )}

          {/* CO2 */}
          {results.isCO2Exempt ? (
            <div className="flex justify-between items-baseline py-2">
              <span className="text-green-700">
                {results.co2SanctionNote === 'below_target' ? t('co2_below_target') : t('co2_exempt')}
              </span>
              <span className="font-mono text-green-700">CHF 0</span>
            </div>
          ) : (
            <>
              <CostRow label={t('co2_sanction')} amount={results.co2Sanction} red />
              <div className="flex items-start gap-2 py-2 px-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">{t('co2_warning')}</p>
              </div>
            </>
          )}

          {/* Customs certificate */}
          {results.customsCertificate > 0 && (
            <CostRow label={t('customs_certificate')} amount={results.customsCertificate} />
          )}
        </div>

        {/* Logistics */}
        <div className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {t('logistics')}
          </p>
          <CostRow label={t('transport')} amount={results.transportCost} />
          {results.exportPlates > 0 && (
            <CostRow label={t('export_plates')} amount={results.exportPlates} />
          )}
        </div>

        {/* Registration */}
        <div className="p-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {t('registration')}
          </p>
          <CostRow label={t('emission_test')} amount={results.emissionTest} />
          <CostRow
            label={t('mfk')}
            amount={results.mfk}
            note={canton?.name[locale]}
          />
        </div>

        {/* Totals */}
        <div className="p-4 bg-gray-50 space-y-1">
          <CostRow label={t('total_import')} amount={results.totalImportCosts} bold />
          <CostRow label={t('total_with_vehicle')} amount={results.totalWithVehicle} bold red />
        </div>
      </div>

      {/* Required forms */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-bold text-dark mb-4">{t('forms_title')}</h3>
        <div className="space-y-3">
          {results.requiredForms.map((form) => (
            <div key={form.id} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  form.userFills ? 'bg-swiss-red-light' : 'bg-gray-100'
                }`}
              >
                {form.userFills ? (
                  <FileText className="w-3 h-3 text-swiss-red" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-dark">{form.name[locale]}</p>
                <p className="text-xs text-gray-600">{form.description[locale]}</p>
                <p className="text-xs mt-0.5">
                  {form.userFills ? (
                    <span className="text-swiss-red">{t('form_you_fill')}</span>
                  ) : (
                    <span className="text-gray-500">{t('form_issued')}</span>
                  )}
                  {form.url && (
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                    >
                      Info <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <PdfDownloadButton data={data} results={results} locale={locale} />
        <button
          onClick={searchProviders}
          disabled={loadingProviders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-swiss-red hover:text-swiss-red transition-all cursor-pointer"
        >
          {t('search_providers')}
        </button>
      </div>

      {/* Providers */}
      {showProviders && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-dark mb-4">
            {t('providers_title')} ({canton?.name[locale]})
          </h3>
          {loadingProviders ? (
            <p className="text-sm text-gray-500 animate-pulse">
              {locale === 'de' ? 'Suche läuft...' : 'Searching...'}
            </p>
          ) : providers.length > 0 ? (
            <div className="space-y-3">
              {providers.map((p, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-700 hover:underline cursor-pointer text-sm"
                  >
                    {p.title}
                  </a>
                  <p className="text-xs text-gray-600 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {locale === 'de'
                ? 'Keine Anbieter gefunden. Versuchen Sie eine manuelle Suche.'
                : 'No providers found. Try a manual search.'}
            </p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        {locale === 'de'
          ? 'Alle Angaben ohne Gewähr. Die tatsächlichen Kosten können abweichen. CO₂-Sanktion ist eine Schätzung — nutzen Sie den offiziellen BFE-Rechner für den genauen Betrag.'
          : 'All information without guarantee. Actual costs may vary. CO₂ sanction is an estimate — use the official BFE calculator for the exact amount.'}
      </p>
    </div>
  );
}
