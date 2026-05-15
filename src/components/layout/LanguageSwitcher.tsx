"use client";

import React, { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';

// 헤더에 들어가는 한/영 토글 버튼. 클릭 시 현재 경로를 유지한 채 locale만 전환한다.
export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const switchTo = locale === 'ko' ? 'en' : 'ko';
  const label = locale === 'ko' ? 'EN' : '한';

  const handleClick = () => {
    startTransition(() => {
      // params는 동적 라우트(예: /sheets/[id])의 값까지 포함해 다시 전달해야 한다.
      router.replace(
        // @ts-expect-error -- pathname은 string이고 params는 라우트 따라 다르다.
        { pathname, params },
        { locale: switchTo }
      );
    });
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#78716A] hover:bg-[#2D2926]/15 hover:text-[#2D2926] text-sm font-semibold transition-colors"
        aria-label="Change language"
      >
        <Globe size={16} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D2926]/5 hover:bg-[#2D2926]/15 text-[#2D2926] text-sm font-bold transition-colors w-full justify-center"
      aria-label="Change language"
    >
      <Globe size={18} />
      <span>{locale === 'ko' ? 'Switch to English' : '한국어로 보기'}</span>
    </button>
  );
}
