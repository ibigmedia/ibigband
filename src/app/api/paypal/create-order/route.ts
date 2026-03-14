import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';

export async function POST(req: Request) {
  try {
    // 1. 프론트엔드에서 결제액을 받아옵니다.
    // 주의: 실서비스에서는 사용자가 "amount=0.01달러" 이런 식으로 변조할 수 있으므로,
    // 데이터베이스에 저장된 진짜 가격 모델(ex: PREMIUM_FEE=9.99명시) 값을 매핑하는 게 안전합니다.
    const body = await req.json();
    const { amount } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: '유효하지 않은 결제 금액입니다.' }, { status: 400 });
    }

    // 2. 페이팔 서버로 주문 ID 발급 요청
    const orderData = await createOrder(amount.toString());
    
    // 3. 발급받은 데이터(특히 id 라는 고유 주문번호)를 프론트로 넘겨줍니다.
    return NextResponse.json(orderData, { status: 200 });

  } catch (error: any) {
    console.error('PayPal Create Order API Error:', error);
    return NextResponse.json({ error: '주문서 생성에 실패했습니다.' }, { status: 500 });
  }
}
