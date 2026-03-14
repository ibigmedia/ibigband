// src/lib/paypal.ts

const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const APP_SECRET = process.env.PAYPAL_SECRET;

/**
 * 임시 접속 토큰(액세스 토큰)을 페이팔 서버로부터 받아옵니다.
 * 이 토큰이 있어야 우리의 Create/Capture 등 모든 요청이 비로소 "우리 서버에서 보낸게 맞다"고 인가받습니다.
 */
export async function generateAccessToken(): Promise<string> {
  if (!CLIENT_ID || !APP_SECRET) {
    throw new Error('페이팔 환경변수(API CREDENTIALS)가 누락되었습니다.');
  }

  const auth = Buffer.from(`${CLIENT_ID}:${APP_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('정상적인 페이팔 엑세스 토큰을 돌려받지 못했습니다.');
  }

  return data.access_token;
}

/**
 * "결제 주문서 번호(Order ID)"를 생성하기 위해 페이팔 서버를 호출합니다.
 */
export async function createOrder(value: string): Promise<any> {
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_API_URL}/v2/checkout/orders`;
  
  const payload = {
    intent: 'CAPTURE', // 사용자가 승인 즉시 즉각 인출하겠다는 옵션
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: value, 
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

/**
 * 프론트에서 "승인됐어!"라고 넘겨준 Order ID를 가로채서,
 * 진짜 승인된 돈인지 한 번 더 페이팔 서버에 승인 확인(Capture)을 때립니다.
 */
export async function captureOrder(orderID: string): Promise<any> {
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.json();
}
