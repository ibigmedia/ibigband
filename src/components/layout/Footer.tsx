"use client";

import React from 'react';
import Link from 'next/link';
import { Music, ExternalLink, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2D2926] text-white/50 py-16 md:py-24 px-6 border-t border-black/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        <div className="col-span-1 md:col-span-1 border-b border-white/10 md:border-0 pb-10 md:pb-0">
          <div className="flex items-center gap-3 text-white mb-6 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-7 h-7 fill-white">
                <rect x="10" y="20" width="15" height="60" rx="4" />
                <path d="M35 20 Q50 20 50 40 Q50 60 35 60 L35 20" />
                <rect x="60" y="20" width="15" height="60" rx="4" />
                <path d="M85 80 Q95 80 95 65 L95 35 Q95 20 85 20" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-3xl md:text-4xl font-handwriting font-bold tracking-tight mt-1">ibigband</span>
          </div>
          <p className="text-sm md:text-base leading-relaxed font-light mb-4 md:mb-0">예술로 복음을 전하는 컨템포러리 아카이브. <br className="hidden md:block"/>하나님이 주신 재능으로 세상을 아름답게 만듭니다.</p>
        </div>
        <div className="pt-4 md:pt-0">
          <h5 className="text-white text-sm font-bold mb-6 md:mb-8 uppercase tracking-[0.2em]">네비게이션</h5>
          <ul className="text-base space-y-5 font-light">
            <li><Link href="/archive" className="hover:text-[#E6C79C] transition-colors">음악 & 악보</Link></li>
            <li><Link href="/blog" className="hover:text-[#E6C79C] transition-colors">아카이브 블로그</Link></li>
            <li><Link href="/setlist" className="hover:text-[#E6C79C] transition-colors">셑리스트 메이커</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white text-sm font-bold mb-8 uppercase tracking-[0.2em]">문의 및 지원</h5>
          <ul className="text-base space-y-5 font-light">
            <li className="cursor-pointer hover:text-white transition-colors flex items-center gap-2"><ExternalLink size={16}/> 파트너십 문의</li>
            <li className="cursor-pointer hover:text-white transition-colors">개인정보처리방침</li>
            <li className="cursor-pointer hover:text-white transition-colors">고객 지원 센터</li>
          </ul>
        </div>
        <div>
          <h5 className="text-white text-sm font-bold mb-8 uppercase tracking-[0.2em]">글로벌 연결</h5>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Youtube size={24} /></a>
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Heart size={24} /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 md:mt-20 pt-8 md:pt-10 border-t border-white/5 flex flex-col-reverse md:flex-row justify-between gap-6 text-[10px] md:text-xs uppercase tracking-widest font-bold text-center md:text-left">
        <span className="opacity-70">&copy; {new Date().getFullYear()} ibigband. Built with Soul & Art.</span>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center justify-center md:justify-end">
          <span className="text-[#E6C79C]">Available on PWA</span>
          <span>Global HQ: New Jersey, USA</span>
        </div>
      </div>
    </footer>
  );
}
