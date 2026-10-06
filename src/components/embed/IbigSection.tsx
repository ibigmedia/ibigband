'use client';
// 아이빅 사역 공개 섹션(3s3k.org 운영실에서 저장한 공개용 자료) — 3s3k.org/ibig.js 가 그림(이 사이트 스타일에 영향 없게 Shadow DOM).
// 자료가 없거나 실패하면 아무것도 안 보임. section: mission-prayer · mission-news · mission-partners · band-songs · band-new · band-storyboards …
import { useEffect } from 'react';

type Props = {
  section: string;
  point?: string; ink?: string; muted?: string; paper?: string; tint?: string; line?: string;
  font?: string; heading?: string; kicker?: string; plain?: boolean; className?: string;
};

export default function IbigSection({ section, plain, className, ...rest }: Props) {
  useEffect(() => {
    const w = window as unknown as { IBIG?: { boot: () => void } };
    if (w.IBIG) { w.IBIG.boot(); return; }
    if (!document.querySelector('script[data-ibig-src]')) {
      const s = document.createElement('script');
      s.src = 'https://3s3k.org/ibig.js';
      s.async = true;
      s.dataset.ibigSrc = '1';
      document.body.appendChild(s);
    }
  }, []);
  const data: Record<string, string> = { 'data-ibig': section };
  for (const [k, v] of Object.entries(rest)) if (v) data['data-' + k] = String(v);
  if (plain) data['data-plain'] = '';
  return <div className={className} {...data} suppressHydrationWarning />;
}
