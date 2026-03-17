"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Maximize, Minimize, Type } from 'lucide-react';

interface LyricsSlide {
  title: string;
  author?: string;
  text: string;
}

export default function LyricsPresenterPage() {
  const [slides, setSlides] = useState<LyricsSlide[]>([]);
  const [currentSong, setCurrentSong] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [fontSize, setFontSize] = useState(48);
  const [showControls, setShowControls] = useState(true);

  // 가사를 섹션(절/후렴 등)으로 분리
  const sections = slides.length > 0
    ? slides[currentSong].text.split(/\n\s*\n/).filter(s => s.trim())
    : [];

  useEffect(() => {
    const stored = localStorage.getItem('ibigband_lyrics_presenter');
    if (stored) {
      try {
        setSlides(JSON.parse(stored));
      } catch (e) {
        console.error('가사 데이터 파싱 실패', e);
      }
    }
  }, []);

  const goNextSection = useCallback(() => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else if (currentSong < slides.length - 1) {
      setCurrentSong(currentSong + 1);
      setCurrentSection(0);
    }
  }, [currentSection, sections.length, currentSong, slides.length]);

  const goPrevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    } else if (currentSong > 0) {
      setCurrentSong(currentSong - 1);
      // 이전 곡의 마지막 섹션으로
      const prevSections = slides[currentSong - 1].text.split(/\n\s*\n/).filter(s => s.trim());
      setCurrentSection(prevSections.length - 1);
    }
  }, [currentSection, currentSong, slides]);

  const goNextSong = useCallback(() => {
    if (currentSong < slides.length - 1) {
      setCurrentSong(currentSong + 1);
      setCurrentSection(0);
    }
  }, [currentSong, slides.length]);

  const goPrevSong = useCallback(() => {
    if (currentSong > 0) {
      setCurrentSong(currentSong - 1);
      setCurrentSection(0);
    }
  }, [currentSong]);

  // 키보드 단축키
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown':
          e.preventDefault();
          goNextSection();
          break;
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault();
          goPrevSection();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goNextSong();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goPrevSong();
          break;
        case '+': case '=':
          setFontSize(s => Math.min(s + 4, 96));
          break;
        case '-':
          setFontSize(s => Math.max(s - 4, 24));
          break;
        case 'Escape':
          setShowControls(c => !c);
          break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            document.documentElement.requestFullscreen?.();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNextSection, goPrevSection, goNextSong, goPrevSong]);

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Type size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">가사 데이터가 없습니다</p>
          <p className="text-gray-400 mt-2">셋리스트 페이지에서 가사 프레젠테이션을 실행해 주세요.</p>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSong];
  const currentText = sections[currentSection] || '';

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col select-none cursor-default"
      onClick={goNextSection}>

      {/* 상단 정보 바 */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
        <div className="bg-gradient-to-b from-black/80 to-transparent px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{currentSlide.title}</h2>
              {currentSlide.author && (
                <p className="text-[#E6C79C] text-sm mt-0.5">{currentSlide.author}</p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{currentSong + 1} / {slides.length}곡</span>
              <span className="text-[#E6C79C]">{currentSection + 1} / {sections.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 가사 본문 */}
      <div className="flex-1 flex items-center justify-center px-12 py-24"
        onClick={(e) => { e.stopPropagation(); goNextSection(); }}>
        <div className="max-w-5xl w-full text-center">
          <p className="font-bold leading-relaxed tracking-wide whitespace-pre-wrap"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}>
            {currentText}
          </p>
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
        <div className="bg-gradient-to-t from-black/80 to-transparent px-8 py-5">
          <div className="flex items-center justify-between">
            {/* 곡 목록 미니맵 */}
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <button key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentSong(i); setCurrentSection(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    i === currentSong ? 'bg-[#E6C79C] text-[#2D2926]' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}>
                  {i + 1}. {s.title.length > 12 ? s.title.slice(0, 12) + '…' : s.title}
                </button>
              ))}
            </div>

            {/* 네비게이션 + 폰트 크기 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                <button onClick={(e) => { e.stopPropagation(); setFontSize(s => Math.max(s - 4, 24)); }}
                  className="p-1 hover:bg-white/20 rounded text-sm font-bold">A-</button>
                <span className="text-xs text-gray-400 w-8 text-center">{fontSize}</span>
                <button onClick={(e) => { e.stopPropagation(); setFontSize(s => Math.min(s + 4, 96)); }}
                  className="p-1 hover:bg-white/20 rounded text-sm font-bold">A+</button>
              </div>

              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); goPrevSection(); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center gap-1">
                  <ChevronLeft size={16} /> 이전
                </button>
                <button onClick={(e) => { e.stopPropagation(); goNextSection(); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center gap-1">
                  다음 <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 섹션 진행 바 */}
          <div className="flex gap-1 mt-3">
            {sections.map((_, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); setCurrentSection(i); }}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  i === currentSection ? 'bg-[#E6C79C]' : i < currentSection ? 'bg-white/30' : 'bg-white/10'
                }`} />
            ))}
          </div>

          {/* 단축키 안내 */}
          <div className="text-center mt-2 text-[10px] text-gray-500">
            ←→ 섹션 이동 · ↑↓ 곡 이동 · +/- 글자 크기 · F 전체화면 · ESC 컨트롤 토글
          </div>
        </div>
      </div>
    </div>
  );
}
