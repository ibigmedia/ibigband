import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { corsHeaders, handlePreflight } from '@/lib/api/cors';
import { verifyUser, canAccessPremium, isErrorResponse } from '@/lib/api-auth';

export const OPTIONS = handlePreflight;

/**
 * /sheets 갤러리용 내부 API.
 * - 로그인/등급 정보를 토큰으로 확인해 프리미엄 sheet의 pdfUrl/audioUrl을 마스킹합니다.
 * - 외부 사이트(giljabi/ibigmission)는 /api/sheets (무료만 노출)를 계속 사용합니다.
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503, headers });
  }

  const verified = await verifyUser(request);
  if (isErrorResponse(verified)) return verified;

  const premiumAllowed = canAccessPremium(verified);

  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const limitNum = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 200) : 0;

  try {
    let q = adminDb.collection('sheets').orderBy('createdAt', 'desc') as FirebaseFirestore.Query;
    if (limitNum > 0) q = q.limit(limitNum);
    const snapshot = await q.get();

    const sheets = snapshot.docs.map((doc) => {
      const data = doc.data();
      const locked = Boolean(data.isPremiumOnly) && !premiumAllowed;
      return {
        id: doc.id,
        title: data.title,
        artistId: data.artistId || '',
        youtubeId: data.youtubeId || '',
        bpm: data.bpm ?? '',
        key: data.key || '',
        moodTags: data.moodTags || [],
        thumbnailUrl: data.thumbnailUrl || '',
        level: data.level || '',
        albumId: data.albumId || '',
        trackId: data.trackId || '',
        isPremiumOnly: Boolean(data.isPremiumOnly),
        price: data.price ?? '',
        createdAt: data.createdAt ?? 0,
        // 잠긴 경우 다운로드 URL을 클라이언트에 노출하지 않습니다.
        pdfUrl: locked ? '' : (data.pdfUrl || ''),
        audioUrl: locked ? '' : (data.audioUrl || ''),
        // UI에서 파일 존재 여부만 표시할 수 있도록 boolean 플래그 동봉
        hasPdf: Boolean(data.pdfUrl),
        hasAudio: Boolean(data.audioUrl),
      };
    });

    return NextResponse.json({ sheets, total: sheets.length }, { headers });
  } catch (error) {
    console.error('Sheets list API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sheets' }, { status: 500, headers });
  }
}
