import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderID, userId } = body;

    // 1. 유효성 체크
    if (!orderID || !userId) {
      return NextResponse.json({ error: '결제 식별자나 유저 ID가 누락되었습니다.' }, { status: 400 });
    }

    // 2. 가로챈 orderID를 다시 페이팔 서버로 던져서 "진짜 결제 성공 맞는지" 검증! (캡처)
    // 이것 없이 클라이언트 말만 믿으면 가짜 영수증 해킹에 무방비입니다.
    const captureData = await captureOrder(orderID);

    // 3. 페이팔이 "응, 돈 들어왔어(네트웍 완료상태)"라고 응답했다면
    if (captureData.status === 'COMPLETED') {
      
      // 4. Firebase Admin DB(보안 우회)를 열고, 바로 유저를 프리미엄으로 승격!
      if (!adminDb) {
        return NextResponse.json({ error: '서버 환경 설정(Firebase Admin) 오류로 DB 접근이 불가능합니다.' }, { status: 500 });
      }

      const userRef = adminDb.collection('users').doc(userId);
      await userRef.update({
        isPremium: true,
        premiumSince: new Date().toISOString()
      });

      return NextResponse.json({ success: true, captureData }, { status: 200 });

    } else {
      // 결제가 승인 거절되거나 잔액 부족으로 홀딩된 상태
      return NextResponse.json({ error: '페이팔 결제가 최종 승인되지 않았습니다.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PayPal Capture API Error:', error);
    return NextResponse.json({ error: '서버 에러가 발생하여 결제 승인에 실패했습니다.' }, { status: 500 });
  }
}
