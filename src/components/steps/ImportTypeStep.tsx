'use client';

import { useTranslations } from 'next-intl';
import { useWizard } from '@/lib/store';
import { ShoppingCart, Home, Heart, Gift, Clock } from 'lucide-react';
import type { ImportType } from '@/lib/calculator';

const importTypes: { value: ImportType; icon: typeof ShoppingCart }[] = [
  { value: 'standard', icon: ShoppingCart },
  { value: 'relocation', icon: Home },
  { value: 'inheritance', icon: Gift },
  { value: 'marriage', icon: Heart },
  { value: 'temporary', icon: Clock },
];

export default function ImportTypeStep() {
  const t = useTranslations('import_type');
  const { data, updateData } = useWizard();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>

      <div className="space-y-3">
        {importTypes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => updateData({ importType: value })}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer ${
              data.importType === value
                ? 'border-swiss-red bg-swiss-red-light'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                data.importType === value
                  ? 'bg-swiss-red text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p
                className={`font-semibold ${
                  data.importType === value ? 'text-swiss-red' : 'text-dark'
                }`}
              >
                {t(value)}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{t(`${value}_desc`)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
