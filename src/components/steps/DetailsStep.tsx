'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWizard } from '@/lib/store';
import { cantons } from '@/lib/cantonData';
import { Info } from 'lucide-react';

export default function DetailsStep() {
  const t = useTranslations('details');
  const locale = useLocale() as 'de' | 'en';
  const { data, updateData } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>

      {/* Canton */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('canton')}</label>
        <select
          value={data.canton}
          onChange={(e) => updateData({ canton: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all cursor-pointer"
        >
          {cantons.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name[locale]}
            </option>
          ))}
        </select>
      </div>

      {/* Ownership months */}
      {(data.importType === 'relocation' ||
        data.importType === 'inheritance' ||
        data.importType === 'marriage') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('ownership')}
          </label>
          <input
            type="number"
            value={data.ownershipMonths || ''}
            onChange={(e) => updateData({ ownershipMonths: parseInt(e.target.value) || 0 })}
            min={0}
            max={600}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('ownership_help')}
          </p>
          {data.importType === 'relocation' && data.ownershipMonths > 0 && data.ownershipMonths < 6 && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {locale === 'de'
                ? 'Achtung: Für die Steuerbefreiung als Übersiedlungsgut muss das Fahrzeug mindestens 6 Monate in Ihrem Besitz sein.'
                : 'Warning: For tax exemption as household effects, the vehicle must have been in your possession for at least 6 months.'}
            </p>
          )}
        </div>
      )}

      {/* Already in Switzerland */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('in_switzerland')}
        </label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => updateData({ alreadyInSwitzerland: val })}
              className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                data.alreadyInSwitzerland === val
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
      </div>
    </div>
  );
}
