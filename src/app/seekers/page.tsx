import React from 'react';
import { Wrench } from 'lucide-react';

export default function SeekersPage() {
  return (
    <div className="flex-1 py-12 px-5 md:px-8 flex flex-col items-center justify-center text-center">
      <Wrench className="w-16 h-16 text-[#E6C79C] mb-6" />
      <h1 className="text-3xl md:text-4xl font-bold text-[#2D2926] mb-4">페이지 준비 중입니다</h1>
      <p className="text-[#78716A] md:text-lg max-w-md mx-auto">
        Seekers 메뉴는 현재 오픈을 위해 준비 중입니다. 보다 유익한 콘텐츠로 찾아뵙겠습니다.
      </p>
    </div>
  );
}
