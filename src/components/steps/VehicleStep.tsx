'use client';

import { useTranslations } from 'next-intl';
import { useWizard } from '@/lib/store';
import { Info } from 'lucide-react';

const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF'];

export default function VehicleStep() {
  const t = useTranslations('vehicle');
  const { data, updateData } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('make')}</label>
          <input
            type="text"
            value={data.vehicleMake}
            onChange={(e) => updateData({ vehicleMake: e.target.value })}
            placeholder={t('make_placeholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('model')}</label>
          <input
            type="text"
            value={data.vehicleModel}
            onChange={(e) => updateData({ vehicleModel: e.target.value })}
            placeholder={t('model_placeholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('year')}</label>
          <input
            type="number"
            value={data.vehicleYear || ''}
            onChange={(e) => updateData({ vehicleYear: parseInt(e.target.value) || 0 })}
            min={1950}
            max={new Date().getFullYear() + 1}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('weight')}</label>
          <input
            type="number"
            value={data.vehicleWeight || ''}
            onChange={(e) => updateData({ vehicleWeight: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('weight_help')}
          </p>
        </div>

        {/* CO2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('co2')}</label>
          <input
            type="number"
            value={data.co2Emissions || ''}
            onChange={(e) => updateData({ co2Emissions: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('co2_help')}
          </p>
        </div>

        {/* First registration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('first_reg')}</label>
          <input
            type="date"
            value={data.firstRegistrationDate}
            onChange={(e) => updateData({ firstRegistrationDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
        </div>

        {/* KM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('km')}</label>
          <input
            type="number"
            value={data.vehicleKm || ''}
            onChange={(e) => updateData({ vehicleKm: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
        </div>

        {/* Is new */}
        <div className="flex items-center gap-3 pt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.isNew}
              onChange={(e) => updateData({ isNew: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-swiss-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-swiss-red"></div>
          </label>
          <span className="text-sm font-medium text-gray-700">{t('is_new')}</span>
        </div>
      </div>

      {/* Price section */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
            <input
              type="number"
              value={data.purchasePrice || ''}
              onChange={(e) => updateData({ purchasePrice: parseFloat(e.target.value) || 0 })}
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('currency')}</label>
            <select
              value={data.purchaseCurrency}
              onChange={(e) => updateData({ purchaseCurrency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('value_chf')}</label>
          <input
            type="number"
            value={data.vehicleValueCHF || ''}
            onChange={(e) => updateData({ vehicleValueCHF: parseFloat(e.target.value) || 0 })}
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all"
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('value_chf_help')}
          </p>
        </div>
      </div>
    </div>
  );
}
