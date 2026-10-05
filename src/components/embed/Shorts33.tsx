'use client';
// 아이빅 33 묵상 쇼츠(3s3k.org) — 월·수·금 유튜브에 공개되는 묵상 쇼츠를 최신 1편 크게 + 지난 영상으로 보여 준다.
// 자료·그림은 3s3k.org/shorts33.js 가 그림(이 사이트 스타일에 영향 없게 Shadow DOM). 영상이 없거나 실패하면 아무것도 안 보임.
import { useEffect } from 'react';

type Props = {
  point?: string; ink?: string; muted?: string; paper?: string; tint?: string; line?: string;
  font?: string; heading?: string; kicker?: string; count?: number; plain?: boolean; className?: string;
};

export default function Shorts33({ count = 6, plain, className, ...rest }: Props) {
  useEffect(() => {
    const w = window as unknown as { S33?: { boot: () => void } };
    if (w.S33) { w.S33.boot(); return; }
    if (!document.querySelector('script[data-s33-src]')) {
      const s = document.createElement('script');
      s.src = 'https://3s3k.org/shorts33.js';
      s.async = true;
      s.dataset.s33Src = '1';
      document.body.appendChild(s);
    }
  }, []);
  const data: Record<string, string> = { 'data-s33': '', 'data-count': String(count) };
  for (const [k, v] of Object.entries(rest)) if (v) data['data-' + k] = String(v);
  if (plain) data['data-plain'] = '';
  return <div className={className} {...data} suppressHydrationWarning />;
}
