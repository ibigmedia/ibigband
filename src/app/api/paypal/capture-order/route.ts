import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';
import { adminDb } from '@/lib/firebase/admin';
import {
  SHEET_UNLOCK_PRICE_USD,
  SHEET_UNLOCK_VALID_DAYS,
  type PaymentPurpose,
} from '@/lib/pricing';
import type { SheetPurchase } from '@/types/purchase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderID, userId } = body as { orderID?: string; userId?: string };
    const purpose: PaymentPurpose = body?.purpose === 'sheet' ? 'sheet' : 'membership';
    const sheetId: string | undefined = typeof body?.sheetId === 'string' ? body.sheetId : undefined;

    if (!orderID || !userId) {
      return NextResponse.json({ error: '결제 식별자나 유저 ID가 누락되었습니다.' }, { status: 400 });
    }
    if (purpose === 'sheet' && !sheetId) {
      return NextResponse.json({ error: '시트 구매에는 sheetId가 필요합니다.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: '서버 환경 설정(Firebase Admin) 오류로 DB 접근이 불가능합니다.' }, { status: 500 });
    }

    // PayPal에 다시 확인 (capture)
    const captureData = await captureOrder(orderID);
    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json({ error: '페이팔 결제가 최종 승인되지 않았습니다.' }, { status: 400 });
    }

    if (purpose === 'membership') {
      // 멤버십 승격
      await adminDb.collection('users').doc(userId).update({
        isPremium: true,
        premiumSince: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, captureData }, { status: 200 });
    }

    // 단발 PDF 구매 — users/{uid}/purchasedSheets/{sheetId} 기록
    const purchaseRef = adminDb
      .collection('users').doc(userId)
      .collection('purchasedSheets').doc(sheetId!);

    const now = new Date();
    const expires = new Date(now.getTime() + SHEET_UNLOCK_VALID_DAYS * 24 * 60 * 60 * 1000);
    const record: SheetPurchase = {
      sheetId: sheetId!,
      orderID,
      amount: SHEET_UNLOCK_PRICE_USD,
      purchasedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    // set + merge 로 재구매 시 만료일 갱신
    await purchaseRef.set(record, { merge: true });

    return NextResponse.json({ success: true, captureData, expiresAt: record.expiresAt }, { status: 200 });
  } catch (error) {
    console.error('PayPal Capture API Error:', error);
    return NextResponse.json({ error: '서버 에러가 발생하여 결제 승인에 실패했습니다.' }, { status: 500 });
  }
}
