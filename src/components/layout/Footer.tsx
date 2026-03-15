"use client";

import React from 'react';
import Link from 'next/link';
import { Music, ExternalLink, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2D2926] text-white/50 py-10 md:py-24 px-5 md:px-6 border-t border-black/10">
      <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-12">
        <div className="border-b border-white/10 md:border-0 pb-6 md:pb-0">
          <div className="flex items-center gap-3 text-white mb-4 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-7 md:h-7 fill-white">
                <rect x="10" y="20" width="15" height="60" rx="4" />
                <path d="M35 20 Q50 20 50 40 Q50 60 35 60 L35 20" />
                <rect x="60" y="20" width="15" height="60" rx="4" />
                <path d="M85 80 Q95 80 95 65 L95 35 Q95 20 85 20" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl md:text-4xl font-handwriting font-bold tracking-tight mt-1">ibiGband</span>
          </div>
          <p className="text-[13px] md:text-base leading-relaxed font-light mb-4 md:mb-0">예술로 복음을 전하는 컨템포러리 아카이브. <br className="hidden md:block"/>하나님이 주신 재능으로 세상을 아름답게 만듭니다.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:contents">
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[10px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">네비게이션</h5>
            <ul className="text-[10px] md:text-base space-y-2 md:space-y-5 font-light tracking-tighter md:tracking-normal">
              <li><Link href="/archive" className="hover:text-[#E6C79C] transition-colors whitespace-nowrap">음악 & 악보</Link></li>
              <li><Link href="/blog" className="hover:text-[#E6C79C] transition-colors whitespace-nowrap">아카이브 블로그</Link></li>
              <li><Link href="/setlist" className="hover:text-[#E6C79C] transition-colors whitespace-nowrap">셑리스트 메이커</Link></li>
            </ul>
          </div>
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[10px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">문의 및 지원</h5>
            <ul className="text-[10px] md:text-base space-y-2 md:space-y-5 font-light tracking-tighter md:tracking-normal">
              <li className="cursor-pointer hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"><ExternalLink size={10} className="md:w-4 md:h-4"/> 파트너십 문의</li>
              <li className="cursor-pointer hover:text-white transition-colors whitespace-nowrap">개인정보처리방침</li>
              <li className="cursor-pointer hover:text-white transition-colors whitespace-nowrap">고객 지원 센터</li>
            </ul>
          </div>
          <div className="pt-2 md:pt-0 shrink-0">
            <h5 className="text-white text-[10px] md:text-sm font-bold mb-3 md:mb-8 uppercase tracking-tighter md:tracking-[0.2em] whitespace-nowrap">글로벌 연결</h5>
            <div className="flex gap-2 flex-wrap">
              <a href="#" className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Youtube size={16} className="md:w-6 md:h-6" /></a>
              <a href="#" className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Heart size={16} className="md:w-6 md:h-6" /></a>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 md:mt-20 pt-6 md:pt-10 border-t border-white/5 flex flex-col-reverse md:flex-row justify-between gap-4 md:gap-6 text-[9px] md:text-xs uppercase tracking-widest font-bold text-center md:text-left">
        <span className="opacity-70">&copy; {new Date().getFullYear()} ibiGband. Built with Soul & Art.</span>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-center justify-center md:justify-end">
          <span className="text-[#E6C79C]">Available on PWA</span>
          <span>Global HQ: New Jersey, USA</span>
        </div>
      </div>
    </footer>
  );
}
