"use client";

import { Download, Play, Search, Heart, Layout } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Archive() {
  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto mb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-handwriting mb-2">악보 및 자료</h2>
          <p className="text-sm text-[#78716A]">고해상도 PDF와 연습용 음원을 다운로드하세요.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Input type="text" placeholder="곡 제목, 태그 검색" className="pl-10 pr-4 py-4" />
            <Search className="absolute left-3.5 top-4 text-[#78716A]" size={18} />
          </div>
          <button className="p-4 bg-white border border-[#78716A]/10 rounded-full hover:bg-[#78716A]/5">
            <Layout size={20}/>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1,2,3,4,5,6].map(i => (
          <Card key={i} className="group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#E6C79C]"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="px-3 py-1 bg-[#E6C79C]/20 rounded-full text-[10px] font-bold text-[#2D2926]">PREMIUM</div>
              <Heart size={18} className="text-[#78716A] hover:text-red-400 cursor-pointer transition-colors" />
            </div>
            <h4 className="text-2xl font-handwriting mb-2 relative z-10">은혜로운 찬양 제 {i}집</h4>
            <p className="text-xs text-[#78716A] mb-8 font-light italic relative z-10">ibigband Live | Key of G | 110 BPM</p>
            <div className="flex gap-3 relative z-10">
              <Button variant="primary" className="flex-1 text-xs gap-2 rounded-2xl py-4" size="md">
                <Download size={14}/> PDF 받기
              </Button>
              <button className="w-14 h-14 bg-[#FAF9F6] rounded-2xl flex items-center justify-center hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]">
                <Play size={20} fill="currentColor" className="ml-1" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
