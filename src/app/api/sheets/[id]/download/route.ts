import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { corsHeaders, handlePreflight } from '@/lib/api/cors';
import { verifyUser, canAccessPremium, isErrorResponse } from '@/lib/api-auth';

export const OPTIONS = handlePreflight;

/**
 * 악보 파일 다운로드 URL 발급 라우트.
 * GET /api/sheets/[id]/download?type=pdf|audio
 *
 * - 프리미엄 sheet은 로그인 + (프리미엄 결제 || 밴드멤버 이상 || 관리자) 인 경우에만 URL을 반환합니다.
 * - 현재 Storage 객체는 공개 download URL 그대로 저장되어 있어, 검증 후 동일 URL을 반환합니다.
 *   추후 Storage 비공개 전환 시 이 라우트에서 signed URL을 발급하도록 교체하면 됩니다.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503, headers });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  if (type !== 'pdf' && type !== 'audio') {
    return NextResponse.json({ error: 'type 파라미터는 pdf 또는 audio 여야 합니다.' }, { status: 400, headers });
  }

  const verified = await verifyUser(request);
  if (isErrorResponse(verified)) return verified;

  try {
    const snap = await adminDb.collection('sheets').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: '악보를 찾을 수 없습니다.' }, { status: 404, headers });
    }
    const data = snap.data() as { isPremiumOnly?: boolean; pdfUrl?: string; audioUrl?: string };

    if (data.isPremiumOnly && !canAccessPremium(verified)) {
      const reason = verified ? 'upgrade' : 'login';
      return NextResponse.json(
        { error: '프리미엄 전용 악보입니다.', reason },
        { status: 403, headers }
      );
    }

    const fileUrl = type === 'pdf' ? data.pdfUrl : data.audioUrl;
    if (!fileUrl) {
      return NextResponse.json({ error: '해당 파일이 등록되어 있지 않습니다.' }, { status: 404, headers });
    }

    return NextResponse.json({ url: fileUrl }, { headers });
  } catch (error) {
    console.error('Sheets download API error:', error);
    return NextResponse.json({ error: 'Failed to issue download URL' }, { status: 500, headers });
  }
}
