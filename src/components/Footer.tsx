'use client';

import { useLocale } from 'next-intl';

export default function Footer() {
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>
            {locale === 'de'
              ? `© ${year} Swiss Car Import Calculator. Alle Angaben ohne Gewähr.`
              : `© ${year} Swiss Car Import Calculator. All information without guarantee.`}
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.bazg.admin.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-swiss-red transition-colors cursor-pointer"
            >
              BAZG
            </a>
            <a
              href="https://www.astra.admin.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-swiss-red transition-colors cursor-pointer"
            >
              ASTRA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
