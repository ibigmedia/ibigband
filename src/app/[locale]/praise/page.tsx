import IbigSection from '@/components/embed/IbigSection';
import { Music } from 'lucide-react';

// 찬양과 가사 — 3s3k.org 운영실 찬양 라이브러리에서 자동으로(공개용만). 새 노래 이야기 · 뮤직비디오 스토리보드(공개로 고른 것)
export const metadata = { title: '찬양과 가사 | IBIG Band', description: '아이빅밴드 찬양의 가사와 영상, 묵상에서 태어난 새 노래 이야기, 뮤직비디오 스토리보드.' };

const C = { point: '#2D2926', ink: '#2D2926', muted: '#78716A', paper: '#FAF9F6', tint: '#F2EFE9', line: '#E7E2DA', font: 'var(--font-handwriting)' };

export default function PraisePage() {
  return (
    <div className="flex-1 bg-[#FAF9F6]">
      <section className="pt-32 pb-12 px-6 text-center">
        <span className="text-[#B08D57] text-sm font-bold tracking-widest uppercase mb-4 inline-flex items-center gap-2"><Music size={16} /> IBIG Praise Library</span>
        <h1 className="text-4xl md:text-6xl font-handwriting text-[#2D2926] mb-4 leading-tight break-keep">찬양과 가사</h1>
        <p className="text-[#78716A] text-lg max-w-2xl mx-auto font-light break-keep">곡을 누르면 가사와 영상이 열려요. 말씀 묵상에서 태어난 새 노래 이야기도 함께 나눕니다.</p>
      </section>
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <IbigSection section="band-new" {...C} plain />
        <IbigSection section="band-songs" {...C} plain />
        <IbigSection section="band-storyboards" {...C} plain />
      </section>
    </div>
  );
}
