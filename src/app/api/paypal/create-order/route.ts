import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';
import { adminDb } from '@/lib/firebase/admin';
import { priceFor, type PaymentPurpose } from '@/lib/pricing';

/**
 * PayPal 주문 발급.
 * - purpose='membership' : 월간 멤버십 ($9.99)
 * - purpose='sheet'      : 단발 PDF 구매 ($3.00) — sheetId 필수
 *
 * 가격은 서버에서 단일 출처로 결정하므로 클라이언트가 amount를 보내도 무시합니다.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const purpose: PaymentPurpose = body?.purpose === 'sheet' ? 'sheet' : 'membership';
    const sheetId: string | undefined = typeof body?.sheetId === 'string' ? body.sheetId : undefined;

    if (purpose === 'sheet') {
      if (!sheetId) {
        return NextResponse.json({ error: '시트 구매에는 sheetId가 필요합니다.' }, { status: 400 });
      }
      if (!adminDb) {
        return NextResponse.json({ error: 'Firebase Admin 초기화 실패' }, { status: 500 });
      }
      // 존재하지 않거나 프리미엄 아닌 시트로 결제가 들어오는 것 방지
      const snap = await adminDb.collection('sheets').doc(sheetId).get();
      if (!snap.exists) {
        return NextResponse.json({ error: '존재하지 않는 악보입니다.' }, { status: 404 });
      }
      const data = snap.data() as { isPremiumOnly?: boolean } | undefined;
      if (!data?.isPremiumOnly) {
        return NextResponse.json({ error: '결제 대상이 아닌 악보입니다.' }, { status: 400 });
      }
    }

    const amount = priceFor(purpose);
    const orderData = await createOrder(amount);
    return NextResponse.json(orderData, { status: 200 });
  } catch (error) {
    console.error('PayPal Create Order API Error:', error);
    return NextResponse.json({ error: '주문서 생성에 실패했습니다.' }, { status: 500 });
  }
}
