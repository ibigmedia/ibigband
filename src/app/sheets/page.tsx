import type { Metadata } from 'next';
import SheetsGallery from '@/components/sheets/SheetsGallery';

export const metadata: Metadata = {
  title: '악보 라이브러리 | ibiGband',
  description:
    '아이빅밴드의 고해상도 PDF 악보와 MR 반주를 한곳에서. 제목/아티스트/감정 태그로 손쉽게 검색하세요.',
  openGraph: {
    title: '악보 라이브러리 | ibiGband',
    description: '아이빅밴드의 고해상도 PDF 악보와 MR 반주 아카이브',
    type: 'website',
  },
};

export default function SheetsGalleryPage() {
  return <SheetsGallery />;
}
