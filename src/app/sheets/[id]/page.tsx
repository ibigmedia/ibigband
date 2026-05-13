import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase/admin';
import SheetsGallery from '@/components/sheets/SheetsGallery';

interface SheetMeta {
  title: string;
  artistId?: string;
  thumbnailUrl?: string;
  youtubeId?: string;
  isPremiumOnly?: boolean;
}

async function getSheetMeta(id: string): Promise<SheetMeta | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection('sheets').doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as Record<string, unknown>;
    return {
      title: typeof d.title === 'string' ? d.title.normalize('NFC') : '',
      artistId: typeof d.artistId === 'string' ? d.artistId.normalize('NFC') : undefined,
      thumbnailUrl: typeof d.thumbnailUrl === 'string' ? d.thumbnailUrl : undefined,
      youtubeId: typeof d.youtubeId === 'string' ? d.youtubeId : undefined,
      isPremiumOnly: Boolean(d.isPremiumOnly),
    };
  } catch (e) {
    console.error('sheet meta fetch failed:', e);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const meta = await getSheetMeta(id);
  if (!meta) {
    return {
      title: '악보를 찾을 수 없습니다 | ibiGband',
    };
  }

  const titleLine = meta.artistId ? `${meta.title} — ${meta.artistId}` : meta.title;
  const fullTitle = `${titleLine} | ibiGband 악보`;
  const description = meta.isPremiumOnly
    ? `${titleLine} 프리미엄 악보 · PDF/MR 다운로드는 멤버십에서 제공됩니다.`
    : `${titleLine} · ibiGband의 PDF 악보와 MR 반주를 만나보세요.`;

  // OG 이미지 우선순위: 등록된 썸네일 → 유튜브 썸네일
  const ogImage =
    meta.thumbnailUrl ||
    (meta.youtubeId ? `https://img.youtube.com/vi/${meta.youtubeId}/maxresdefault.jpg` : undefined);

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'article',
      url: `/sheets/${id}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meta = await getSheetMeta(id);
  if (!meta) notFound();

  // 갤러리를 그대로 렌더링하고 initialSheetId 로 해당 모달을 자동 오픈합니다.
  // 클라이언트가 권한에 맞게 /api/sheets/list 를 불러오므로 보안 가드도 동일하게 적용됩니다.
  return <SheetsGallery initialSheetId={id} />;
}
