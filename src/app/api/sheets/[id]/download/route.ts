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
  // 음원은 참조용으로 듣기만 제공하며 다운로드 라우트로는 발급하지 않습니다.
  if (type !== 'pdf') {
    return NextResponse.json({ error: 'PDF 외 파일은 다운로드 라우트로 제공하지 않습니다.' }, { status: 400, headers });
  }

  const verified = await verifyUser(request);
  if (isErrorResponse(verified)) return verified;

  try {
    const snap = await adminDb.collection('sheets').doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: '악보를 찾을 수 없습니다.' }, { status: 404, headers });
    }
    const data = snap.data() as { isPremiumOnly?: boolean; pdfUrl?: string };

    if (data.isPremiumOnly && !canAccessPremium(verified)) {
      const reason = verified ? 'upgrade' : 'login';
      return NextResponse.json(
        { error: '프리미엄 전용 악보입니다.', reason },
        { status: 403, headers }
      );
    }

    if (!data.pdfUrl) {
      return NextResponse.json({ error: '해당 파일이 등록되어 있지 않습니다.' }, { status: 404, headers });
    }

    return NextResponse.json({ url: data.pdfUrl }, { headers });
  } catch (error) {
    console.error('Sheets download API error:', error);
    return NextResponse.json({ error: 'Failed to issue download URL' }, { status: 500, headers });
  }
}
