'use client';

import PayPalButton from '@/components/PayPalButton';
import { useAuth } from '@/lib/firebase/auth';
import { CheckCircle2 } from 'lucide-react';

export default function PremiumPage() {
  const { user, userData, loading } = useAuth();

  // 프리미엄 혜택 리스트
  const benefits = [
    '모든 악보 PDF 무제한 다운로드',
    '프리미엄 미디어(MR, 비디오) 접근 권한',
    '광고 없는 깔끔한 뷰잉 경험',
    'AI 블로그 생성 및 추천 태깅 기능 접근'
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
          iBigBand 프리미엄 멤버십
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
          모든 제한을 해제하고 무제한 찬양 아카이브를 경험하세요.
        </p>
      </div>

      <div className="mt-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto border border-gray-100 dark:border-zinc-700">
        <div className="px-6 py-8 sm:p-10">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            무제한 이용권
          </h3>
          <div className="flex items-baseline text-5xl font-extrabold text-gray-900 dark:text-white">
            $9.99
            <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/월</span>
          </div>

          <ul className="mt-8 space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{benefit}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            {userData?.isPremium ? (
              <div className="w-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl p-4 text-center font-bold">
                🎉 이미 프리미엄 회원입니다! 🎉
              </div>
            ) : (
              <PayPalButton 
                amount="9.99" 
                onSuccess={() => console.log('결제 완료 리다이렉트 처리')} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
