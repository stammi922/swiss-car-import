'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function FaqPage() {
  const t = useTranslations('faq');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(0);

  const questions = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-dark mb-8">{t('title')}</h1>

      <div className="space-y-3">
        {questions.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-dark pr-4">{item.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                  open === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href={`/${locale}/calculator`}
          className="inline-flex items-center gap-2 bg-swiss-red hover:bg-swiss-red-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors cursor-pointer"
        >
          {tc('start_calculator')}
        </Link>
      </div>
    </div>
  );
}
