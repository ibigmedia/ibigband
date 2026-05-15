// 결제 가격은 서버에서 단일 출처로 관리합니다.
// 클라이언트가 보낸 amount를 그대로 PayPal에 보내면 변조 위험이 있으므로,
// purpose에 따라 서버가 가격을 매핑합니다.

export const PREMIUM_MONTHLY_PRICE_USD = '9.99';
export const SHEET_UNLOCK_PRICE_USD = '3.00';

// 단발 PDF 구매 후 다운로드 가능 기간 (일)
export const SHEET_UNLOCK_VALID_DAYS = 30;

export type PaymentPurpose = 'membership' | 'sheet';

export function priceFor(purpose: PaymentPurpose): string {
  return purpose === 'membership' ? PREMIUM_MONTHLY_PRICE_USD : SHEET_UNLOCK_PRICE_USD;
}
