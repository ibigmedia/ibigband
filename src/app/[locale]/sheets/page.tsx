import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SheetsGallery from '@/components/sheets/SheetsGallery';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sheetsMeta' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    openGraph: {
      title: t('metaTitle'),
      description: t('metaOgDescription'),
      type: 'website',
    },
  };
}

export default function SheetsGalleryPage() {
  return <SheetsGallery />;
}
