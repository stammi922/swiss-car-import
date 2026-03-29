'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWizard } from '@/lib/store';
import { countries } from '@/lib/countries';
import { Info, Truck, Car, Caravan } from 'lucide-react';
import type { TransportMethod } from '@/lib/calculator';

const transportOptions: { value: TransportMethod; icon: typeof Car }[] = [
  { value: 'self', icon: Car },
  { value: 'logistics', icon: Truck },
  { value: 'trailer', icon: Caravan },
];

export default function OriginStep() {
  const t = useTranslations('origin');
  const locale = useLocale() as 'de' | 'en';
  const { data, updateData } = useWizard();

  const selectedCountry = countries.find((c) => c.code === data.originCountry);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label>
        <select
          value={data.originCountry}
          onChange={(e) => {
            const country = countries.find((c) => c.code === e.target.value);
            updateData({
              originCountry: e.target.value,
              hasProofOfOrigin: country?.isEU ? true : data.hasProofOfOrigin,
            });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all cursor-pointer"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name[locale]} {c.isEU ? '(EU)' : c.isFTA ? '(FTA)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* EU/FTA info box */}
      {selectedCountry && (
        <div
          className={`rounded-lg p-4 text-sm ${
            selectedCountry.isEU || selectedCountry.isFTA
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {selectedCountry.isEU
            ? locale === 'de'
              ? 'EU-Land — mit EUR.1/Lieferantenerklärung ist der Import zollfrei.'
              : 'EU country — with EUR.1/supplier declaration, import is duty-free.'
            : selectedCountry.isFTA
            ? locale === 'de'
              ? 'Freihandelsabkommen — mit Ursprungsnachweis ist der Import zollfrei.'
              : 'Free trade agreement — with proof of origin, import is duty-free.'
            : locale === 'de'
            ? 'Kein Freihandelsabkommen — Zoll von CHF 12–15 pro 100 kg fällt an.'
            : 'No free trade agreement — customs duty of CHF 12–15 per 100 kg applies.'}
        </div>
      )}

      {/* EUR.1 */}
      {(selectedCountry?.isEU || selectedCountry?.isFTA) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('has_eur1')}
          </label>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => updateData({ hasProofOfOrigin: val })}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                  data.hasProofOfOrigin === val
                    ? 'border-swiss-red bg-swiss-red-light text-swiss-red'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {val
                  ? locale === 'de'
                    ? 'Ja'
                    : 'Yes'
                  : locale === 'de'
                  ? 'Nein'
                  : 'No'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('has_eur1_help')}
          </p>
        </div>
      )}

      {/* Transport method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('transport')}</label>
        <div className="grid grid-cols-3 gap-3">
          {transportOptions.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updateData({ transportMethod: value })}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                data.transportMethod === value
                  ? 'border-swiss-red bg-swiss-red-light text-swiss-red'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {t(`transport_${value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Transport cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('transport_cost')}
        </label>
        <input
          type="number"
          value={data.transportCostCHF || ''}
          onChange={(e) => updateData({ transportCostCHF: parseFloat(e.target.value) || 0 })}
          min={0}
          placeholder="0"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
        />
        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" /> {t('transport_cost_help')}
        </p>
      </div>
    </div>
  );
}
