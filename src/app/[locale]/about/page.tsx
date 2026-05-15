import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Music, FileMusic, BookOpen, ListMusic, Mail } from 'lucide-react';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: `${t('title')} - ibiGband`,
    description: t('lead'),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations('about');
  const items = [
    { key: 'music', Icon: Music },
    { key: 'sheets', Icon: FileMusic },
    { key: 'blog', Icon: BookOpen },
    { key: 'setlist', Icon: ListMusic },
  ] as const;

  return (
    <div className="flex-1 py-16 md:py-24 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 md:mb-20">
          <h1 className="font-handwriting text-5xl md:text-7xl text-[#2D2926] mb-6">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl text-[#78716A] leading-relaxed">
            {t('lead')}
          </p>
        </header>

        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D2926] mb-4">
            {t('missionTitle')}
          </h2>
          <p className="text-base md:text-lg text-[#78716A] leading-relaxed">
            {t('missionBody')}
          </p>
        </section>

        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D2926] mb-6">
            {t('whatTitle')}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(({ key, Icon }) => (
              <li
                key={key}
                className="flex items-start gap-4 p-5 rounded-2xl bg-[#FDFBF7] border border-[#78716A]/10"
              >
                <div className="w-10 h-10 rounded-xl bg-[#E6C79C]/30 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#2D2926]" />
                </div>
                <p className="text-[#2D2926] text-sm md:text-base leading-relaxed">
                  {t(`whatList.${key}`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#2D2926] text-white rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('contactTitle')}</h2>
          <p className="text-white/70 mb-6 leading-relaxed">{t('contactBody')}</p>
          <a
            href={`mailto:${t('contactEmail')}`}
            className="inline-flex items-center gap-2 bg-[#E6C79C] text-[#2D2926] px-6 py-3 rounded-full font-bold hover:shadow-lg transition-shadow"
          >
            <Mail size={18} />
            {t('contactEmail')}
          </a>
        </section>
      </div>
    </div>
  );
}
