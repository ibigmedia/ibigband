"use client";

import { Music, FileText, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 selection:bg-[#E6C79C]/30 relative overflow-hidden">
      {/* Background SVG line drawing animation */}
      <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,50 Q25,20 50,50 T100,50" className="line-draw" fill="none" stroke="#2D2926" strokeWidth="0.5" />
        <path d="M0,70 Q25,90 50,70 T100,70" className="line-draw" fill="none" stroke="#E6C79C" strokeWidth="0.5" />
      </svg>
      
      <div className="mb-8 p-4 rounded-full bg-[#E6C79C]/10 inline-block animate-pulse relative z-10">
        <Music size={40} className="text-[#E6C79C]" />
      </div>
      <h1 className="text-6xl md:text-8xl font-handwriting mb-6 leading-tight relative z-10">
        찬양이 멈추지 않는 <br/><span className="text-[#E6C79C]">아카이브</span>
      </h1>
      <p className="text-[#78716A] max-w-xl mx-auto mb-10 font-light leading-relaxed relative z-10">
        고퀄리티 악보, MR, 그리고 아티스트의 고뇌가 담긴 블로그 미디어를 만나보세요. <br/>
        언제 어디서나 앱처럼 간편하게 접속할 수 있습니다.
      </p>
      <div className="flex flex-wrap gap-4 justify-center relative z-10">
        <Button variant="primary" size="lg" onClick={() => router.push('/archive')} className="flex items-center gap-3">
          <FileText size={20}/> 악보 라이브러리
        </Button>
        <Button variant="outline" size="lg" onClick={() => router.push('/setlist')} className="flex items-center gap-3">
          <List size={20}/> 스마트 셋리스트
        </Button>
      </div>
    </div>
  );
}
