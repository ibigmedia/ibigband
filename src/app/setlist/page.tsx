"use client";

import { Share2, Printer, Plus, Edit3, Trash2, Menu, Play, FileText, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function SetList() {
  const [items, setItems] = useState([
    { id: 1, type: 'music', title: '내 영혼이 은총 입어', duration: '5:00', note: 'Verse-Chorus-Bridge-Chorus' },
    { id: 2, type: 'guide', title: '예배 안내 및 대표 기도', duration: '3:00', note: 'Pad Pad 배경음악' }
  ]);

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto mb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white rounded-ibig p-10 shadow-sm border border-[#78716A]/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <h2 className="text-4xl font-handwriting">스마트 셋리스트</h2>
            <div className="flex gap-2">
              <button className="p-3 bg-[#FAF9F6] rounded-full hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]" title="공유하기">
                <Share2 size={20}/>
              </button>
              <button className="p-3 bg-[#FAF9F6] rounded-full hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]" title="출력하기">
                <Printer size={20}/>
              </button>
              <button className="bg-[#2D2926] text-white px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-[#78716A] transition-colors">
                <Plus size={16}/> 새 순서 추가
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
             {items.map((item, idx) => (
               <div key={item.id} className="flex items-center gap-6 bg-[#FAF9F6] p-6 rounded-2xl border border-transparent hover:border-[#E6C79C] transition-all group">
                 <div className="text-2xl font-handwriting text-[#E6C79C] w-8">{idx + 1}</div>
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                     <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${item.type === 'music' ? 'bg-[#2D2926] text-white' : 'bg-[#E6C79C] text-[#2D2926]'}`}>
                        {item.type}
                     </span>
                     <span className="font-bold">{item.title}</span>
                     <span className="text-[10px] text-[#78716A] ml-2">{item.duration}</span>
                   </div>
                   <p className="text-xs text-[#78716A] italic font-light">{item.note}</p>
                 </div>
                 <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit3 size={18} className="text-[#78716A] cursor-pointer hover:text-[#2D2926]" />
                   <Trash2 size={18} className="text-red-300 cursor-pointer hover:text-red-500" />
                   <Menu size={18} className="text-[#78716A] cursor-grab" />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#2D2926] text-white rounded-ibig p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-handwriting text-2xl mb-2 text-[#E6C79C]">Worship Practice</h3>
            <p className="text-xs text-white/50 mb-8 font-light">셋리스트의 음원들을 차례대로 연습하세요.</p>
            <div className="space-y-4">
              {items.filter(i => i.type === 'music').map(i => (
                <div key={i.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-full bg-[#E6C79C] flex items-center justify-center text-[#2D2926]">
                    <Play size={16} fill="currentColor" className="ml-0.5"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold truncate">{i.title}</p>
                    <p className="text-[10px] text-white/40">연습 음원 로드됨</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 bg-white/10 rounded-2xl text-xs font-bold hover:bg-white/20 transition-all">전체 자동 재생</button>
          </div>
          <svg className="absolute -bottom-10 -right-10 opacity-5" width="200" height="200" viewBox="0 0 100 100">
            <path d="M0 50 Q25 0 50 50 T100 50" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="bg-white rounded-ibig p-8 shadow-sm border border-[#78716A]/10">
          <h3 className="font-handwriting text-xl mb-6">마스터 플랜 공유</h3>
          <div className="space-y-3">
             <button className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
               <Share2 size={16}/> 팀원에게 링크 보내기
             </button>
             <button className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
               <FileText size={16}/> 큐시트 PDF 내보내기
             </button>
             <button className="w-full p-4 bg-[#FAF9F6] rounded-2xl flex items-center gap-3 text-xs font-bold hover:bg-[#E6C79C]/10 transition-all text-[#78716A]">
               <Calendar size={16}/> 구글 캘린더 연동
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
