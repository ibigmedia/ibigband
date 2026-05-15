import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { corsHeaders, handlePreflight } from '@/lib/api/cors';
import { verifyUser, canAccessPremium, isErrorResponse } from '@/lib/api-auth';
import type { SheetPurchase } from '@/types/purchase';

export const OPTIONS = handlePreflight;

/**
 * 악보 파일 다운로드 URL 발급 라우트.
 * GET /api/sheets/[id]/download?type=pdf
 *
 * 권한 규칙:
 *  - 프리미엄 sheet은 (멤버십 가입자) OR (해당 sheet을 구매했고 만료 전) 인 경우에만 URL 반환.
 *  - 단발 구매 기록: users/{uid}/purchasedSheets/{sheetId}.expiresAt 이 현재 시각 이후.
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

    if (data.isPremiumOnly) {
      const hasMembership = canAccessPremium(verified);
      let hasValidPurchase = false;

      if (!hasMembership && verified) {
        const purchaseSnap = await adminDb
          .collection('users').doc(verified.uid)
          .collection('purchasedSheets').doc(id)
          .get();
        if (purchaseSnap.exists) {
          const p = purchaseSnap.data() as SheetPurchase | undefined;
          const exp = p?.expiresAt ? Date.parse(p.expiresAt) : 0;
          hasValidPurchase = Number.isFinite(exp) && exp > Date.now();
        }
      }

      if (!hasMembership && !hasValidPurchase) {
        const reason = verified ? 'upgrade' : 'login';
        return NextResponse.json(
          { error: '프리미엄 전용 악보입니다.', reason },
          { status: 403, headers }
        );
      }
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
