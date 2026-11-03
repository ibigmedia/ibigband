import IbigSection from '@/components/embed/IbigSection';
import { Music } from 'lucide-react';

// 찬양과 가사 — 3s3k.org 운영실 찬양 라이브러리에서 자동으로(공개용만). 새 노래 이야기 · 뮤직비디오 스토리보드(공개로 고른 것)
export const metadata = { title: '찬양과 가사 | IBIG Band', description: '아이빅밴드 찬양의 가사와 영상, 묵상에서 태어난 새 노래 이야기, 뮤직비디오 스토리보드.' };

const C = { point: '#121110', ink: '#121110', muted: '#78716A', paper: '#F5F2EC', tint: '#ECE7DC', line: '#E0DBD0', font: 'var(--font-handwriting)' };

export default function PraisePage() {
  return (
    <div className="flex-1 bg-[#F5F2EC]">
      <section className="pt-32 pb-12 px-6 text-center">
        <span className="text-t-copper text-sm font-bold tracking-widest uppercase mb-4 inline-flex items-center gap-2"><Music size={16} /> IBIG Praise Library</span>
        <h1 className="text-3xl md:text-5xl font-handwriting text-[#121110] mb-4 leading-tight break-keep">찬양과 가사</h1>
        <p className="text-t-muted text-lg max-w-2xl mx-auto font-normal break-keep">곡을 누르면 가사와 영상이 열려요. 말씀 묵상에서 태어난 새 노래 이야기도 함께 나눕니다.</p>
      </section>
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <IbigSection section="band-new" {...C} plain />
        <IbigSection section="band-songs" {...C} plain />
        <IbigSection section="band-storyboards" {...C} plain />
      </section>
    </div>
  );
}
