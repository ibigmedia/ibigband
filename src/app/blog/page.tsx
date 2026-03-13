"use client";

import Image from 'next/image';

export default function Blog() {
  return (
    <div className="pt-32 px-6 max-w-5xl mx-auto mb-20">
      <div className="text-center mb-20 space-y-4">
        <h2 className="text-6xl font-handwriting">묵상과 예술</h2>
        <p className="text-[#78716A] italic font-light">"찬양은 삶의 고백이자 예술의 완성입니다."</p>
        <div className="w-20 h-1 bg-[#E6C79C] mx-auto rounded-full mt-8"></div>
      </div>
      
      <div className="space-y-32">
        {[1, 2].map(i => (
          <article key={i} className="group relative">
            <div className="aspect-[21/10] rounded-ibig overflow-hidden mb-10 shadow-2xl relative bg-[#2D2926]">
              {/* Note: Using a placeholder color or gradient if external image domain isn't configured in next.config.ts */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2D2926] to-[#78716A] group-hover:scale-110 transition-transform duration-[2s]"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white z-10">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2 block text-[#E6C79C]">Artist Note • 2024.11.20</span>
                <h3 className="text-4xl md:text-5xl font-handwriting leading-tight">깊은 밤의 찬양,<br/>고독이 예술이 될 때</h3>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto text-center md:text-left">
              <p className="text-lg text-[#78716A] leading-relaxed font-light mb-8">
                음악은 때로 단어보다 훨씬 많은 것을 말해줍니다. 우리가 광야에 서 있을 때, 그 적막 속에서 울려 퍼지는 작은 멜로디는 하나님께 닿는 가장 순수한 기도가 됩니다. 이번 리세션에서는 우리가 가진 가장 연약한 부분을 찬양으로 승화시키는 과정을 돌아봅니다...
              </p>
              <button className="px-8 py-3 border border-[#E6C79C] text-[#E6C79C] rounded-full text-sm font-bold hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all">
                더 읽어보기
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
