"use client";

import React from 'react';
import Link from 'next/link';
import { Music, ExternalLink, Youtube, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#2D2926] text-white/50 py-24 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Music size={20} /></div>
            <span className="text-2xl font-handwriting font-bold tracking-tight">ibigband</span>
          </div>
          <p className="text-xs leading-relaxed font-light">예술로 복음을 전하는 컨템포러리 아카이브. <br/>하나님이 주신 재능으로 세상을 아름답게 만듭니다.</p>
        </div>
        <div>
          <h5 className="text-white text-[11px] font-bold mb-8 uppercase tracking-[0.2em]">Navigation</h5>
          <ul className="text-xs space-y-5 font-light">
            <li><Link href="/archive" className="hover:text-[#E6C79C] transition-colors">Music & Sheets</Link></li>
            <li><Link href="/blog" className="hover:text-[#E6C79C] transition-colors">Archive Blog</Link></li>
            <li><Link href="/setlist" className="hover:text-[#E6C79C] transition-colors">Set List Maker</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white text-[11px] font-bold mb-8 uppercase tracking-[0.2em]">Contact & Support</h5>
          <ul className="text-xs space-y-5 font-light">
            <li className="cursor-pointer hover:text-white transition-colors flex items-center gap-2"><ExternalLink size={12}/> Partnership</li>
            <li className="cursor-pointer hover:text-white transition-colors">Privacy Policy</li>
            <li className="cursor-pointer hover:text-white transition-colors">Support Center</li>
          </ul>
        </div>
        <div>
          <h5 className="text-white text-[11px] font-bold mb-8 uppercase tracking-[0.2em]">Global Connect</h5>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Youtube size={24} /></a>
            <a href="#" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E6C79C] hover:text-[#2D2926] transition-all"><Heart size={24} /></a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 text-[10px] uppercase tracking-widest font-bold">
        <span>&copy; {new Date().getFullYear()} ibigband. Built with Soul & Art.</span>
        <div className="flex gap-8">
          <span className="text-[#E6C79C]">Available on PWA</span>
          <span>Global HQ: New Jersey, USA</span>
        </div>
      </div>
    </footer>
  );
}
