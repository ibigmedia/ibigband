'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

interface Props {
  amount: string; // 예: "9.99"
  onSuccess?: () => void;
}

export default function PayPalButton({ amount, onSuccess }: Props) {
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
        body: JSON.stringify({ amount }),
      });
      const orderData = await response.json();

      if (orderData.id) {
        return orderData.id;
      } else {
        throw new Error('주문서 번호를 발급받지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('결제 요청 생성 중 서버 에러가 발생했습니다.');
      return ''; 
    }
  };

  const onApprove = async (data: any) => {
    try {
      // 결제창에서 고객이 결제승인(Approve)을 눌렀다면, 백엔드로 이 ID를 보냅니다.
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: data.orderID,
          userId: user.uid, // 이 사용자를 꼭 프리미엄으로 올려주세요!
        }),
      });

      const captureData = await response.json();

      if (captureData.error) {
         setError(captureData.error);
         return;
      }
      
      alert('결제가 성공적으로 검증되었습니다! 이제 모든 프리미엄 콘텐츠를 마음껏 즐기세요 🎉');
      if (onSuccess) onSuccess();
      
      // 사용자 권한이 바뀌었으므로 리프레시를 유도합니다.
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
      
      {/* 
        clientId를 못 찾으면 기본 샌드박스로 시도 (실제환경에선 반드시 존재해야함)
      */}
      <PayPalScriptProvider options={{ 
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
        currency: 'USD', // 달러 고정
        locale: 'en_US', // 접속자의 브라우저가 한국어라도 무조건 미국 영문으로 페이팔 팝업이 뜨도록 강제 고정합니다.
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
    </div>
  );
}
