'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === 'de' ? 'en' : 'de';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath || `/${newLocale}`);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-5 bg-swiss-red relative flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">+</span>
          </div>
          <span className="font-bold text-dark text-lg hidden sm:inline">
            {locale === 'de' ? 'Import-Rechner' : 'Import Calculator'}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href={`/${locale}/calculator`}
            className="text-sm font-medium text-gray-600 hover:text-swiss-red transition-colors cursor-pointer"
          >
            {t('start_calculator')}
          </Link>
          <Link
            href={`/${locale}/faq`}
            className="text-sm font-medium text-gray-600 hover:text-swiss-red transition-colors cursor-pointer"
          >
            {t('faq')}
          </Link>
          <button
            onClick={switchLocale}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-swiss-red transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            {t('language')}
          </button>
        </nav>
      </div>
    </header>
  );
}
