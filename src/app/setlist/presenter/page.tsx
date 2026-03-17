"use client";

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, FileText, Play } from 'lucide-react';

export default function PresenterPage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('ibigband_presenter_items');
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse presenter items', e);
      }
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#2D2926] text-white flex items-center justify-center">
        <p>셋리스트 데이터가 없습니다. 창을 닫고 다시 실행해주세요.</p>
      </div>
    );
  }

  const activeItem = items[currentIndex];

  const goNext = () => {
    if (currentIndex < items.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#2D2926] text-white flex flex-col">
      <header className="p-4 flex justify-between items-center bg-[#1A1816] shadow-md z-10 transition-opacity opacity-0 hover:opacity-100">
        <div className="flex items-center gap-4">
           <div>
              <h2 className="text-xl font-bold">{activeItem.title}</h2>
              <p className="text-[#E6C79C] text-sm">{activeItem.author}</p>
           </div>
        </div>
        <div className="flex gap-4">
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-[#2D2926] flex flex-col items-center justify-center -mt-16">
         {(activeItem.type === 'sheet' || activeItem.hasPdf) ? (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center text-[#2D2926] overflow-hidden">
               {activeItem.fileUrl ? (
                 <iframe src={`${activeItem.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0" />
               ) : (
                 <>
                   <FileText size={48} className="text-black/20 mb-4" />
                   <p className="font-bold text-xl">PDF 뷰어 화면 (예제 파일 없음)</p>
                 </>
               )}
            </div>
         ) : (
            <div className="max-w-4xl text-center space-y-6 flex-1 flex flex-col justify-center items-center">
              <p className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-[#FAF9F6] whitespace-pre-wrap">
                {activeItem.note || activeItem.memo || '등록된 내용이 없습니다.'}
              </p>
              <p className="text-[#E6C79C] text-xl font-handwriting tracking-wider pt-10">
                -- 프롬프터 모드 --
              </p>
            </div>
         )}
      </div>
      
      <div className="fixed bottom-0 w-full bg-[#1A1816] p-6 flex justify-between items-center border-t border-white/5 transition-opacity opacity-0 hover:opacity-100">
         <div className="flex gap-4">
            <button 
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 ${currentIndex === 0 ? 'bg-white/5 text-gray-500' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <ChevronLeft size={16}/> 이전
            </button>
         </div>
         
         <div className="flex gap-4">
            <button 
              onClick={goNext}
              disabled={currentIndex === items.length - 1}
              className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 ${currentIndex === items.length - 1 ? 'bg-white/5 text-gray-500' : 'bg-white/10 hover:bg-white/20'}`}
            >
              다음 <ChevronRight size={16}/>
            </button>
         </div>
      </div>
    </div>
  );
}
