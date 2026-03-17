"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Maximize, Music, FileText, Type } from 'lucide-react';

// --- 슬라이드 타입 ---
type Slide = {
  type: 'title' | 'pdf' | 'lyrics';
  songIndex: number;
  songTitle: string;
  songAuthor?: string;
  totalSongs: number;
  fileUrl?: string;
  text?: string;
  sectionIndex?: number;
  totalSections?: number;
};

// 섹션 마커 감지
const SECTION_MARKER_RE = /^(\[(?:1절|2절|3절|4절|5절|6절|7절|8절|Verse\s*\d*|Chorus|후렴|브릿지|Bridge|Intro|Outro|간주|반복|Refrain|Pre-?Chorus|Tag|Coda|Ending)[^\]]*\])$/i;

export default function PresenterPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [fontSize, setFontSize] = useState(48);
  const [showUI, setShowUI] = useState(true);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  // localStorage에서 데이터 로드 및 슬라이드 생성
  useEffect(() => {
    const stored = localStorage.getItem('ibigband_presenter_items');
    if (!stored) return;

    try {
      const items: any[] = JSON.parse(stored);
      const allSlides: Slide[] = [];

      items.forEach((item, idx) => {
        const base = {
          songIndex: idx,
          songTitle: item.title || '제목 없음',
          songAuthor: item.author,
          totalSongs: items.length,
        };

        const lyrics = item.lyrics || item.note || '';
        const sections = lyrics.split(/\n\s*\n/).filter((s: string) => s.trim());
        const hasPdf = item.hasPdf && item.fileUrl;
        const hasLyrics = sections.length > 0;

        // 타이틀 슬라이드
        allSlides.push({ ...base, type: 'title' });

        if (hasLyrics) {
          // 가사 섹션 슬라이드
          sections.forEach((sec: string, si: number) => {
            allSlides.push({
              ...base,
              type: 'lyrics',
              text: sec.trim(),
              sectionIndex: si,
              totalSections: sections.length,
            });
          });
        } else if (hasPdf) {
          // PDF 슬라이드 (가사 없을 때만)
          allSlides.push({ ...base, type: 'pdf', fileUrl: item.fileUrl });
        }
      });

      setSlides(allSlides);
    } catch (e) {
      console.error('프레젠터 데이터 파싱 실패', e);
    }
  }, []);

  // 슬라이드 전환 (페이드 효과)
  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setFadeClass('opacity-0');
    setTimeout(() => {
      setCurrent(index);
      setFadeClass('opacity-100');
    }, 150);
  }, [slides.length]);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // 특정 곡의 첫 슬라이드로 이동
  const goToSong = useCallback((songIdx: number) => {
    const idx = slides.findIndex(s => s.songIndex === songIdx);
    if (idx >= 0) goTo(idx);
  }, [slides, goTo]);

  // 키보드 단축키
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'PageDown':
          e.preventDefault(); goNext(); break;
        case 'ArrowLeft': case 'PageUp':
          e.preventDefault(); goPrev(); break;
        case '+': case '=':
          setFontSize(s => Math.min(s + 4, 96)); break;
        case '-':
          setFontSize(s => Math.max(s - 4, 24)); break;
        case 'Escape':
          setShowUI(c => !c); break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            if (document.fullscreenElement) document.exitFullscreen?.();
            else document.documentElement.requestFullscreen?.();
          }
          break;
        case 'Home':
          e.preventDefault(); goTo(0); break;
        case 'End':
          e.preventDefault(); goTo(slides.length - 1); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, goTo, slides.length]);

  // 빈 상태
  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Music size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">셋리스트 데이터가 없습니다</p>
          <p className="text-gray-400 mt-2">셋리스트 페이지에서 프레젠터 뷰를 실행해 주세요.</p>
        </div>
      </div>
    );
  }

  const slide = slides[current];

  // 곡 목록 (중복 제거)
  const songList = slides.reduce<{ title: string; author?: string; index: number }[]>((acc, s) => {
    if (s.type === 'title') acc.push({ title: s.songTitle, author: s.songAuthor, index: s.songIndex });
    return acc;
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col select-none overflow-hidden"
      onClick={goNext}>

      {/* ===== 상단 바 ===== */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-b from-black/90 via-black/60 to-transparent px-6 md:px-10 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold tracking-tight truncate">{slide.songTitle}</h2>
              {slide.songAuthor && (
                <p className="text-[#E6C79C] text-xs md:text-sm mt-0.5 truncate">{slide.songAuthor}</p>
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-5 text-xs md:text-sm text-gray-400 shrink-0 ml-4">
              <span>{slide.songIndex + 1} / {slide.totalSongs}곡</span>
              {slide.type === 'lyrics' && slide.totalSections && (
                <span className="text-[#E6C79C]">
                  {(slide.sectionIndex ?? 0) + 1} / {slide.totalSections}절
                </span>
              )}
              <span className="text-white/30">{current + 1}/{slides.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 슬라이드 본문 ===== */}
      <div className={`flex-1 flex items-center justify-center transition-opacity duration-150 ${fadeClass}`}>

        {/* 타이틀 슬라이드 */}
        {slide.type === 'title' && (
          <div className="text-center px-8 md:px-16">
            <p className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight text-white">
              {slide.songTitle}
            </p>
            {slide.songAuthor && (
              <p className="text-xl md:text-3xl text-[#E6C79C] mt-4 md:mt-6 font-handwriting tracking-wider">
                {slide.songAuthor}
              </p>
            )}
            <div className="mt-8 md:mt-12 flex items-center justify-center gap-2 text-white/20">
              <Music size={16} />
              <span className="text-sm">{slide.songIndex + 1} / {slide.totalSongs}</span>
            </div>
          </div>
        )}

        {/* 가사 슬라이드 */}
        {slide.type === 'lyrics' && slide.text && (
          <div className="max-w-5xl w-full text-center px-8 md:px-16">
            <div className="font-bold leading-relaxed tracking-wide"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}>
              {renderLyrics(slide.text)}
            </div>
          </div>
        )}

        {/* PDF 슬라이드 */}
        {slide.type === 'pdf' && slide.fileUrl && (
          <div className="w-full h-full bg-white flex items-center justify-center">
            <iframe
              src={`${slide.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>

      {/* ===== 하단 컨트롤 ===== */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 md:px-10 py-4 md:py-6">

          {/* 곡 미니맵 */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
            {songList.map(s => (
              <button key={s.index}
                onClick={() => goToSong(s.index)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  s.index === slide.songIndex
                    ? 'bg-[#E6C79C] text-[#2D2926]'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}>
                {s.index + 1}. {s.title.length > 10 ? s.title.slice(0, 10) + '…' : s.title}
              </button>
            ))}
          </div>

          {/* 네비게이션 + 컨트롤 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => goPrev()}
                disabled={current === 0}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${
                  current === 0 ? 'bg-white/5 text-gray-600' : 'bg-white/10 hover:bg-white/20'
                }`}>
                <ChevronLeft size={16} /> 이전
              </button>
              <button onClick={() => goNext()}
                disabled={current === slides.length - 1}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${
                  current === slides.length - 1 ? 'bg-white/5 text-gray-600' : 'bg-white/10 hover:bg-white/20'
                }`}>
                다음 <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* 폰트 크기 */}
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                <button onClick={() => setFontSize(s => Math.max(s - 4, 24))}
                  className="p-1 hover:bg-white/20 rounded text-xs font-bold">A-</button>
                <span className="text-[10px] text-gray-400 w-7 text-center">{fontSize}</span>
                <button onClick={() => setFontSize(s => Math.min(s + 4, 96))}
                  className="p-1 hover:bg-white/20 rounded text-xs font-bold">A+</button>
              </div>
              {/* 전체화면 */}
              <button onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen?.();
                else document.documentElement.requestFullscreen?.();
              }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
                <Maximize size={16} />
              </button>
            </div>
          </div>

          {/* 전체 진행 바 */}
          <div className="flex gap-0.5 mt-3">
            {slides.map((s, i) => (
              <button key={i}
                onClick={() => goTo(i)}
                className={`h-1 rounded-full flex-1 transition-all ${
                  i === current ? 'bg-[#E6C79C]' : i < current ? 'bg-white/30' : 'bg-white/10'
                }`} />
            ))}
          </div>

          {/* 단축키 안내 */}
          <div className="text-center mt-2 text-[10px] text-gray-600">
            ←→ / Space 슬라이드 이동 · +/- 글자 크기 · F 전체화면 · ESC UI 토글 · 화면 클릭 = 다음
          </div>
        </div>
      </div>
    </div>
  );
}

// 가사 렌더링: 섹션 마커는 작게 표시
function renderLyrics(text: string) {
  const cleaned = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  return cleaned.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (SECTION_MARKER_RE.test(trimmed)) {
      return (
        <div key={i} className="text-white/25 font-normal"
          style={{ fontSize: '0.4em', marginTop: '0.5em', marginBottom: '0.2em' }}>
          {trimmed}
        </div>
      );
    }
    return <div key={i}>{trimmed || '\u00A0'}</div>;
  });
}
