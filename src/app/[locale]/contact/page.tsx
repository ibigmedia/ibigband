import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ContactForm from '@/components/contact/ContactForm';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: `${t('title')} | ibiGband`, description: t('lead') };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return (
    <div className="flex-1 bg-[#F5F2EC] px-5 py-14 md:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[2fr_3fr]">
        <div>
          <h1 className="font-handwriting text-[36px] md:text-[52px] leading-[1.1] text-[#121110]">{t('title')}</h1>
          <p className="mt-5 text-t-muted leading-relaxed">{t('lead')}</p>
          <a href={`mailto:${t('email')}`} className="mt-6 inline-block font-semibold text-t-copper hover:underline">{t('email')}</a>
        </div>
        <ContactForm lang={locale === 'en' ? 'en' : 'ko'} />
      </div>
    </div>
  );
}
