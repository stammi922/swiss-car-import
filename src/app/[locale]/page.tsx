import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Calculator, FileText, ListChecks, Search } from 'lucide-react';

export default function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('landing');
  const tc = useTranslations('common');

  const features = [
    { icon: Calculator, title: t('feature_1_title'), desc: t('feature_1_desc') },
    { icon: FileText, title: t('feature_2_title'), desc: t('feature_2_desc') },
    { icon: ListChecks, title: t('feature_3_title'), desc: t('feature_3_desc') },
    { icon: Search, title: t('feature_4_title'), desc: t('feature_4_desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-swiss-red" />
        <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-dark leading-tight mb-6">
            {t('hero_title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            {t('hero_subtitle')}
          </p>
          <Link
            href={`/${locale}/calculator`}
            className="inline-flex items-center gap-2 bg-swiss-red hover:bg-swiss-red-dark text-white font-semibold px-8 py-4 rounded-lg transition-colors cursor-pointer text-lg"
          >
            <Calculator className="w-5 h-5" />
            {tc('start_calculator')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-swiss-red/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-swiss-red-light flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-swiss-red" />
                </div>
                <h3 className="font-semibold text-dark text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-12 border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            {locale === 'de'
              ? 'Basierend auf den aktuellen Richtlinien des BAZG (Bundesamt für Zoll und Grenzsicherheit). Kostenlos und ohne Registrierung.'
              : 'Based on current BAZG (Federal Office for Customs and Border Security) guidelines. Free and no registration required.'}
          </p>
        </div>
      </section>
    </div>
  );
}
