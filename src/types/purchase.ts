// 단발 PDF 구매 기록. Firestore 경로: users/{uid}/purchasedSheets/{sheetId}
export interface SheetPurchase {
  sheetId: string;
  orderID: string;       // PayPal 주문 ID (중복 캡처 방지)
  amount: string;        // 결제 금액 USD 문자열 (예: "3.00")
  purchasedAt: string;   // ISO timestamp
  expiresAt: string;     // ISO timestamp — 이 시점까지 다운로드 가능
}
