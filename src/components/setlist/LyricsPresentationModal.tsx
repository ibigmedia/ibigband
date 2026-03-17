"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Play, FileText, Presentation, Plus, Trash2, Edit3, Check, ChevronUp, ChevronDown, Loader2, Copy, AlignLeft, AlignCenter, AlignRight, Save } from 'lucide-react';
// pdf-lib는 exportPdf 함수 내에서 dynamic import

type TextAlign = 'left' | 'center' | 'right';

export interface LyricsSlide {
  title: string;
  author?: string;
  text: string;
  sourceId?: string;      // 아카이브 매칭용
  align?: TextAlign;      // 텍스트 정렬
  fontSize?: number;       // 커스텀 폰트 크기
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialSlides: LyricsSlide[];
  setlistTitle: string;
  onLaunchPresenter: (slides: LyricsSlide[]) => void;
  onSyncToArchive?: (slides: { sourceId?: string; title: string; lyrics: string }[]) => Promise<void>;
}

export default function LyricsPresentationModal({ isOpen, onClose, initialSlides, setlistTitle, onLaunchPresenter, onSyncToArchive }: Props) {
  const [slides, setSlides] = useState<LyricsSlide[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [exporting, setExporting] = useState<'pdf' | 'gslides' | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewSection, setPreviewSection] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSlides(initialSlides.map(s => ({ ...s, align: s.align || 'center', fontSize: s.fontSize || 0 })));
      setEditingIndex(null);
      setPreviewIndex(null);
    }
  }, [isOpen, initialSlides]);

  // 키보드 좌우 화살표로 슬라이드/섹션 이동
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editingIndex !== null) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (previewIndex === null) {
        if (slides.length > 0) { setPreviewIndex(0); setPreviewSection(0); }
        return;
      }
      const sections = slides[previewIndex].text.split(/\n\s*\n/).filter(s => s.trim());
      if (previewSection < sections.length - 1) {
        setPreviewSection(prev => prev + 1);
      } else if (previewIndex < slides.length - 1) {
        setPreviewIndex(prev => (prev ?? 0) + 1);
        setPreviewSection(0);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (previewIndex === null) return;
      if (previewSection > 0) {
        setPreviewSection(prev => prev - 1);
      } else if (previewIndex > 0) {
        const prevIdx = previewIndex - 1;
        const prevSections = slides[prevIdx].text.split(/\n\s*\n/).filter(s => s.trim());
        setPreviewIndex(prevIdx);
        setPreviewSection(Math.max(0, prevSections.length - 1));
      }
    }
  }, [editingIndex, previewIndex, previewSection, slides]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditText(slides[i].text);
    setEditTitle(slides[i].title);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    setSlides(prev => prev.map((s, i) => i === editingIndex ? { ...s, title: editTitle, text: editText } : s));
    setEditingIndex(null);
  };

  const removeSlide = (i: number) => {
    setSlides(prev => prev.filter((_, idx) => idx !== i));
    if (previewIndex === i) setPreviewIndex(null);
  };

  const duplicateSlide = (i: number) => {
    setSlides(prev => {
      const next = [...prev];
      next.splice(i + 1, 0, { ...prev[i], sourceId: undefined });
      return next;
    });
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    setSlides(prev => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const setSlideAlign = (i: number, align: TextAlign) => {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, align } : s));
  };

  const setSlideFontSize = (i: number, fontSize: number) => {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, fontSize } : s));
  };

  const addEmptySlide = () => {
    const newLen = slides.length;
    setSlides(prev => [...prev, { title: '새 슬라이드', text: '', align: 'center', fontSize: 0 }]);
    setEditingIndex(newLen);
    setEditTitle('새 슬라이드');
    setEditText('');
  };

  // 아카이브 동기화 저장
  const handleSyncSave = async () => {
    if (!onSyncToArchive) return;
    setSyncing(true);
    try {
      const syncData = slides
        .filter(s => s.text.trim())
        .map(s => ({ sourceId: s.sourceId, title: s.title, lyrics: s.text }));
      await onSyncToArchive(syncData);
      alert('아카이브에 가사가 동기화 저장되었습니다!');
    } catch (e: any) {
      alert('동기화 실패: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  // PDF 내보내기
  const exportPdf = async () => {
    if (slides.length === 0) return;
    setExporting('pdf');
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const fontkitModule = await import('@pdf-lib/fontkit');
      const fontkit = fontkitModule.default ?? fontkitModule;
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit as any);

      const loadFont = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`폰트 로드 실패: ${url} (${res.status})`);
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/html')) throw new Error(`폰트 대신 HTML 반환됨: ${url}`);
        const buf = await res.arrayBuffer();
        if (buf.byteLength < 1000) throw new Error(`폰트 파일이 너무 작음: ${url} (${buf.byteLength} bytes)`);
        return buf;
      };

      const [regularBytes, boldBytes] = await Promise.all([
        loadFont('/fonts/Pretendard-Regular.ttf'),
        loadFont('/fonts/Pretendard-Bold.ttf'),
      ]);
      const font = await pdfDoc.embedFont(regularBytes);
      const fontBold = await pdfDoc.embedFont(boldBytes);

      const W = 960;
      const H = 540;
      const dark = rgb(0.05, 0.05, 0.05);
      const white = rgb(1, 1, 1);
      const gold = rgb(0.902, 0.78, 0.612);

      for (const slide of slides) {
        const sections = slide.text.split(/\n\s*\n/).filter(s => s.trim());
        const align = slide.align || 'center';

        if (sections.length === 0) {
          const page = pdfDoc.addPage([W, H]);
          page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark });
          const titleWidth = fontBold.widthOfTextAtSize(slide.title, 36);
          page.drawText(slide.title, { x: (W - titleWidth) / 2, y: H / 2, font: fontBold, size: 36, color: white });
          continue;
        }

        for (let si = 0; si < sections.length; si++) {
          const page = pdfDoc.addPage([W, H]);
          page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark });

          const titleStr = `${slide.title}${slide.author ? ' — ' + slide.author : ''}`;
          page.drawText(truncateText(titleStr, W - 120, fontBold, 14), {
            x: 40, y: H - 40, font: fontBold, size: 14, color: gold
          });
          page.drawText(`${si + 1} / ${sections.length}`, {
            x: W - 80, y: H - 40, font, size: 11, color: rgb(0.5, 0.5, 0.5)
          });

          const lines = sections[si].split('\n');
          const customFs = slide.fontSize || 0;
          const fontSize = customFs > 0 ? customFs : (lines.length > 6 ? 22 : lines.length > 4 ? 26 : 32);
          const lineHeight = fontSize * 1.6;
          const totalTextHeight = lines.length * lineHeight;
          let y = (H + totalTextHeight) / 2 - fontSize - 20;

          const markerRe = /^(\[(?:1절|2절|3절|4절|5절|6절|7절|8절|Verse\s*\d*|Chorus|후렴|브릿지|Bridge|Intro|Outro|간주|반복|Refrain|Pre-?Chorus|Tag|Coda|Ending)[^\]]*\])$/i;
          for (const line of lines) {
            let trimmed = line.trim().replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            if (!trimmed) { y -= lineHeight * 0.5; continue; }
            const isMarker = markerRe.test(trimmed);
            const lineFs = isMarker ? Math.round(fontSize * 0.5) : fontSize;
            const lineColor = isMarker ? rgb(0.45, 0.45, 0.45) : white;
            const lineFont = isMarker ? font : fontBold;
            if (isMarker) y += lineHeight * 0.15;
            const textWidth = lineFont.widthOfTextAtSize(trimmed, lineFs);
            const clippedWidth = Math.min(textWidth, W - 100);
            let x: number;
            if (align === 'left') x = 50;
            else if (align === 'right') x = W - 50 - clippedWidth;
            else x = (W - clippedWidth) / 2;

            page.drawText(truncateText(trimmed, W - 100, lineFont, lineFs), {
              x, y, font: lineFont, size: lineFs, color: lineColor,
            });
            y -= isMarker ? lineHeight * 0.6 : lineHeight;
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${setlistTitle || '가사'}_프레젠테이션.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('PDF 생성 실패: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  // Google Slides용 HTML
  const exportGoogleSlides = async () => {
    if (slides.length === 0) return;
    setExporting('gslides');
    try {
      const slidesHtml = slides.flatMap(slide => {
        const sections = slide.text.split(/\n\s*\n/).filter(s => s.trim());
        const align = slide.align || 'center';
        const fs = slide.fontSize || 28;
        if (sections.length === 0) {
          return [`<div class="slide"><h1>${escapeHtml(slide.title)}</h1></div>`];
        }
        return sections.map((sec, si) =>
          `<div class="slide">
            <div class="slide-header">${escapeHtml(slide.title)}${slide.author ? ' — ' + escapeHtml(slide.author) : ''} <span class="page">${si + 1}/${sections.length}</span></div>
            <div class="slide-body" style="text-align:${align};font-size:${fs}px">${sec.split('\n').map(l => escapeHtml(l.trim())).join('<br>')}</div>
          </div>`
        );
      });

      const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<title>${escapeHtml(setlistTitle)} - 가사 프레젠테이션</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR',sans-serif;background:#111}
.slide{width:960px;height:540px;background:#0a0a0a;margin:20px auto;padding:40px 60px;display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;page-break-after:always;border:1px solid #333}
.slide-header{position:absolute;top:20px;left:40px;right:40px;color:#E6C79C;font-size:14px;font-weight:700;display:flex;justify-content:space-between}
.slide-header .page{color:#666;font-size:11px}
.slide-body{color:white;font-weight:700;line-height:1.7;width:100%}
.slide h1{color:white;font-size:36px;font-weight:700}
@media print{body{background:white}.slide{margin:0;border:none;break-after:page}}
</style></head><body>
${slidesHtml.join('\n')}
</body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${setlistTitle || '가사'}_프레젠테이션.html`;
      a.click();
      URL.revokeObjectURL(url);
      alert('HTML 파일이 다운로드됩니다.\n\n구글 슬라이드로 변환:\n1. Google Drive에 업로드\n2. 우클릭 → "연결 앱" → "Google Slides"');
    } catch (e: any) {
      alert('내보내기 실패: ' + e.message);
    } finally {
      setExporting(null);
    }
  };

  const previewSections = previewIndex !== null && slides[previewIndex]
    ? slides[previewIndex].text.split(/\n\s*\n/).filter(s => s.trim())
    : [];

  const FONT_SIZE_OPTIONS = [0, 20, 24, 28, 32, 36, 40, 48, 56];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-5xl h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="p-4 md:p-5 border-b border-black/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                <Presentation size={18} className="text-violet-600" /> 가사 프레젠테이션
              </h3>
              <p className="text-[10px] md:text-xs text-[#78716A] mt-0.5 truncate">{setlistTitle} · {slides.length}곡</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
          </div>
        </div>

        {/* 본문: 모바일 세로 / 데스크톱 2단 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 좌측: 곡 목록 */}
          <div className="flex-1 md:w-1/2 border-b md:border-b-0 md:border-r border-black/5 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {slides.map((slide, i) => (
                <div key={i} className={`border rounded-xl p-3 transition-all ${
                  editingIndex === i ? 'border-violet-400 bg-violet-50' :
                  previewIndex === i ? 'border-[#E6C79C] bg-[#E6C79C]/5' : 'border-black/5 bg-[#FAF9F6] hover:border-[#E6C79C]'
                }`}>
                  {editingIndex === i ? (
                    <div className="space-y-2">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-sm font-bold bg-white border border-violet-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
                        placeholder="곡 제목" />
                      <textarea value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full bg-white border border-violet-300 rounded-lg p-2 text-xs text-[#2D2926] focus:outline-none focus:border-violet-500 min-h-40 resize-y"
                        placeholder="가사를 입력하세요. 빈 줄로 섹션(절/후렴)을 구분합니다." />
                      <div className="flex gap-1.5">
                        <button onClick={saveEdit}
                          className="text-xs font-bold bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 flex items-center gap-1">
                          <Check size={12} /> 확인
                        </button>
                        <button onClick={() => setEditingIndex(null)}
                          className="text-xs font-bold bg-gray-200 text-[#2D2926] px-3 py-1 rounded-lg hover:bg-gray-300">취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                        <button onClick={() => moveSlide(i, -1)} disabled={i === 0}
                          className="p-0.5 text-[#78716A] hover:text-[#2D2926] disabled:opacity-20"><ChevronUp size={12} /></button>
                        <span className="text-[10px] font-bold text-[#78716A] text-center">{i + 1}</span>
                        <button onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}
                          className="p-0.5 text-[#78716A] hover:text-[#2D2926] disabled:opacity-20"><ChevronDown size={12} /></button>
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setPreviewIndex(i); setPreviewSection(0); }}>
                        <p className="font-bold text-sm text-[#2D2926] truncate">{slide.title}</p>
                        {slide.author && <p className="text-[10px] text-[#78716A]">{slide.author}</p>}
                        <p className="text-[10px] text-[#78716A] mt-0.5 line-clamp-2">{slide.text.slice(0, 100)}{slide.text.length > 100 ? '...' : ''}</p>
                        <p className="text-[9px] text-violet-500 mt-0.5">
                          {slide.text.split(/\n\s*\n/).filter(s => s.trim()).length}개 섹션
                          {slide.align && slide.align !== 'center' ? ` · ${slide.align === 'left' ? '좌측' : '우측'} 정렬` : ''}
                          {slide.fontSize && slide.fontSize > 0 ? ` · ${slide.fontSize}px` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <div className="flex gap-0.5">
                          <button onClick={() => startEdit(i)}
                            className="p-1 text-[#78716A] hover:bg-violet-50 hover:text-violet-600 rounded" title="수정">
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => duplicateSlide(i)}
                            className="p-1 text-[#78716A] hover:bg-blue-50 hover:text-blue-600 rounded" title="복제">
                            <Copy size={12} />
                          </button>
                          <button onClick={() => removeSlide(i)}
                            className="p-1 text-red-300 hover:bg-red-50 hover:text-red-500 rounded" title="삭제">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {/* 정렬 + 폰트 크기 */}
                        <div className="flex gap-0.5 items-center">
                          <button onClick={() => setSlideAlign(i, 'left')}
                            className={`p-0.5 rounded ${slide.align === 'left' ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`} title="좌측 정렬">
                            <AlignLeft size={10} />
                          </button>
                          <button onClick={() => setSlideAlign(i, 'center')}
                            className={`p-0.5 rounded ${(!slide.align || slide.align === 'center') ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`} title="중앙 정렬">
                            <AlignCenter size={10} />
                          </button>
                          <button onClick={() => setSlideAlign(i, 'right')}
                            className={`p-0.5 rounded ${slide.align === 'right' ? 'bg-violet-100 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`} title="우측 정렬">
                            <AlignRight size={10} />
                          </button>
                          <select value={slide.fontSize || 0} onChange={e => setSlideFontSize(i, Number(e.target.value))}
                            className="text-[9px] bg-[#FAF9F6] border border-black/10 rounded px-1 py-0.5 focus:outline-none w-12" title="폰트 크기">
                            {FONT_SIZE_OPTIONS.map(fs => (
                              <option key={fs} value={fs}>{fs === 0 ? '자동' : `${fs}px`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button onClick={addEmptySlide}
                className="w-full border border-dashed border-black/10 rounded-xl py-3 text-xs font-bold text-[#78716A] hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-1">
                <Plus size={14} /> 빈 슬라이드 추가
              </button>
            </div>
          </div>

          {/* 우측: 미리보기 */}
          <div className="hidden md:flex md:w-1/2 bg-[#111] flex-col">
            {previewIndex !== null && slides[previewIndex] ? (
              <>
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="w-full max-w-lg aspect-video bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute top-3 left-4 right-4 flex justify-between">
                      <span className="text-[#E6C79C] text-[10px] font-bold truncate max-w-[70%]">
                        {slides[previewIndex].title}{slides[previewIndex].author ? ` — ${slides[previewIndex].author}` : ''}
                      </span>
                      <span className="text-gray-500 text-[9px]">{previewSection + 1}/{previewSections.length}</span>
                    </div>
                    <div className={`font-bold leading-relaxed w-full ${
                      slides[previewIndex].align === 'left' ? 'text-left' :
                      slides[previewIndex].align === 'right' ? 'text-right' : 'text-center'
                    }`} style={{ fontSize: `${slides[previewIndex].fontSize && slides[previewIndex].fontSize! > 0 ? Math.round(slides[previewIndex].fontSize! * 0.4) : 14}px` }}>
                      {renderLyricsWithMarkers(previewSections[previewSection] || '(빈 섹션)')}
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-white/10">
                  <div className="flex gap-1 mb-2">
                    {previewSections.map((_, si) => (
                      <button key={si} onClick={() => setPreviewSection(si)}
                        className={`h-1.5 rounded-full flex-1 transition-all ${
                          si === previewSection ? 'bg-[#E6C79C]' : 'bg-white/15'
                        }`} />
                    ))}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => setPreviewSection(Math.max(0, previewSection - 1))}
                      disabled={previewSection === 0}
                      className="text-xs text-white/60 hover:text-white disabled:opacity-30 px-2 py-1">← 이전</button>
                    <button onClick={() => setPreviewSection(Math.min(previewSections.length - 1, previewSection + 1))}
                      disabled={previewSection >= previewSections.length - 1}
                      className="text-xs text-white/60 hover:text-white disabled:opacity-30 px-2 py-1">다음 →</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                좌측에서 곡을 클릭하면 미리보기가 표시됩니다
              </div>
            )}
          </div>
        </div>

        {/* 하단 액션 바 */}
        <div className="p-3 md:p-4 border-t border-black/5 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-0 md:mb-0">
            <p className="text-[10px] md:text-xs text-[#78716A] shrink-0">
              {slides.reduce((acc, s) => acc + s.text.split(/\n\s*\n/).filter(x => x.trim()).length, 0)}개 슬라이드
            </p>
          </div>
          <div className="flex gap-1.5 md:gap-2 flex-wrap justify-end mt-2">
            {onSyncToArchive && (
              <button onClick={handleSyncSave} disabled={syncing || slides.length === 0}
                className="px-3 md:px-4 py-2 md:py-2.5 bg-green-50 text-green-700 rounded-xl text-[11px] md:text-xs font-bold hover:bg-green-100 disabled:opacity-40 flex items-center gap-1">
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span className="hidden sm:inline">아카이브</span> 저장
              </button>
            )}
            <button onClick={exportPdf} disabled={exporting !== null || slides.length === 0}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-700 rounded-xl text-[11px] md:text-xs font-bold hover:bg-red-100 disabled:opacity-40 flex items-center gap-1">
              {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              PDF
            </button>
            <button onClick={exportGoogleSlides} disabled={exporting !== null || slides.length === 0}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[11px] md:text-xs font-bold hover:bg-blue-100 disabled:opacity-40 flex items-center gap-1">
              {exporting === 'gslides' ? <Loader2 size={14} className="animate-spin" /> : <Presentation size={14} />}
              <span className="hidden sm:inline">Google Slides</span><span className="sm:hidden">HTML</span>
            </button>
            <button onClick={() => { onLaunchPresenter(slides); }}
              disabled={slides.length === 0}
              className="px-3 md:px-5 py-2 md:py-2.5 bg-violet-600 text-white rounded-xl text-[11px] md:text-xs font-bold hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1">
              <Play size={14} /> 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function truncateText(text: string, maxWidth: number, f: any, size: number): string {
  if (!text) return '';
  let t = text;
  try {
    while (t.length > 0 && f.widthOfTextAtSize(t, size) > maxWidth) {
      t = t.slice(0, -1);
    }
    if (t.length < text.length) t = t.slice(0, -1) + '…';
  } catch {
    if (t.length > 40) t = t.slice(0, 40) + '…';
  }
  return t;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 섹션 마커([1절], [후렴] 등)를 작고 흐리게 렌더링
const SECTION_MARKER_RE = /^(\[(?:1절|2절|3절|4절|5절|6절|7절|8절|Verse\s*\d*|Chorus|후렴|브릿지|Bridge|Intro|Outro|간주|반복|Refrain|Pre-?Chorus|Tag|Coda|Ending)[^\]]*\])$/i;

function renderLyricsWithMarkers(text: string) {
  // 마크다운 볼드 제거
  const cleaned = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  const lines = cleaned.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (SECTION_MARKER_RE.test(trimmed)) {
      return (
        <div key={i} className="text-white/30 font-normal" style={{ fontSize: '0.55em', marginTop: '0.3em', marginBottom: '0.1em' }}>
          {trimmed}
        </div>
      );
    }
    return <div key={i} className="text-white">{trimmed || '\u00A0'}</div>;
  });
}
