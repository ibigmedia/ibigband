'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import type { PaymentPurpose } from '@/lib/pricing';

interface Props {
  amount: string;             // 화면 표시용 (실제 결제 금액은 서버가 결정)
  purpose?: PaymentPurpose;   // 기본 'membership'
  sheetId?: string;           // purpose='sheet' 일 때 필수
  onSuccess?: (info?: { expiresAt?: string }) => void;
}

export default function PayPalButton({ amount, purpose = 'membership', sheetId, onSuccess }: Props) {
  const { user, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!user) {
    return (
      <div className="p-4 text-center bg-gray-50 dark:bg-zinc-800 rounded-xl">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          결제를 진행하시려면 로그인이 필수입니다.
        </p>
        <button
          onClick={signInWithGoogle}
          className="bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold px-4 py-2 rounded-lg"
        >
          Google 계정으로 로그인 (1초)
        </button>
      </div>
    );
  }

  const createOrder = async () => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, sheetId }),
      });
      const orderData = await response.json();

      if (orderData.id) return orderData.id;
      throw new Error(orderData.error || '주문서 번호를 발급받지 못했습니다.');
    } catch (err) {
      console.error(err);
      setError('결제 요청 생성 중 서버 에러가 발생했습니다.');
      return '';
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: data.orderID,
          userId: user.uid,
          purpose,
          sheetId,
        }),
      });
      const captureData = await response.json();

      if (captureData.error) {
        setError(captureData.error);
        return;
      }

      if (purpose === 'membership') {
        alert('결제가 성공적으로 검증되었습니다! 이제 모든 프리미엄 콘텐츠를 마음껏 즐기세요 🎉');
      } else {
        alert('결제가 완료되었습니다! 30일간 PDF 다운로드가 가능합니다.');
      }
      onSuccess?.({ expiresAt: captureData?.expiresAt });
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('승인 확인 과정에서 예외 에러가 일어났습니다. 고객센터 문의 요망.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 mb-4 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <PayPalScriptProvider options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
        currency: 'USD',
        locale: 'en_US',
      }}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', color: 'black' }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            console.error('PayPal 스크립트 내부 에러', err);
            setError('결제 위젯을 가져오는 중 문제가 일어났습니다.');
          }}
        />
      </PayPalScriptProvider>

      {amount && (
        <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          청구 금액: ${amount} USD
        </p>
      )}
    </div>
  );
}
