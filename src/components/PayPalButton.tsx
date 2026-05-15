'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('payment');

  if (!user) {
    return (
      <div className="p-4 text-center bg-gray-50 dark:bg-zinc-800 rounded-xl">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
          {t('loginRequired')}
        </p>
        <button
          onClick={signInWithGoogle}
          className="bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold px-4 py-2 rounded-lg"
        >
          {t('googleLogin1s')}
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
      throw new Error(orderData.error || t('errOrderId'));
    } catch (err) {
      console.error(err);
      setError(t('errCreateOrder'));
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
        alert(t('successMembership'));
      } else {
        alert(t('successSheet'));
      }
      onSuccess?.({ expiresAt: captureData?.expiresAt });
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('errApprove'));
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
            setError(t('errWidget'));
          }}
        />
      </PayPalScriptProvider>

      {amount && (
        <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {t('billed', { amount })}
        </p>
      )}
    </div>
  );
}
