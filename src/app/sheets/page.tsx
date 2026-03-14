'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Search, Music, PlayCircle, FileText, Activity, Hash, Tag as TagIcon, LayoutGrid, X, Download } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Sheet {
  id: string;
  title: string;
  artistId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  bpm?: number | string;
  key?: string;
  moodTags?: string[];
  isPremiumOnly?: boolean;
  price?: string;
  createdAt: number;
}

export default function SheetsGalleryPage() {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modal State
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      setError(null);
      const q = query(collection(db, 'sheets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data() as Omit<Sheet, 'id'>;
        return { 
          id: doc.id, 
          ...d,
          title: d.title ? d.title.normalize('NFC') : '',
          artistId: d.artistId ? d.artistId.normalize('NFC') : d.artistId,
        } as Sheet;
      });
      setSheets(data);
    } catch (err: any) {
      console.error('Error fetching sheets:', err);
      setError(err?.message || '악보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      sheets.flatMap(sheet => 
        (sheet.moodTags || [])
      )
    )
  );

  // Normalize search term as well just to be safe
  const normalizedSearchTerm = searchTerm.normalize('NFC');

  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(normalizedSearchTerm.toLowerCase()) || 
                          (sheet.artistId && sheet.artistId.toLowerCase().includes(normalizedSearchTerm.toLowerCase()));
    const matchesTag = selectedTag ? (sheet.moodTags || []).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 bg-[#0A0A0A] text-[#F4F4F5] pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E6C79C] to-[#C9A675] mb-4">
              프리미엄 악보
            </h1>
            <p className="text-lg text-[#A1A1AA] max-w-2xl">
              다음 연주를 위한 전문적인 악보를 찾아보세요. 
              제목, 아티스트, 곡의 감정이나 장르로 검색할 수 있습니다.
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <Input 
              placeholder="곡 제목이나 아티스트로 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-[#A1A1AA]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === null 
                  ? 'bg-[#E6C79C] text-black' 
                  : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              전체
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag 
                    ? 'bg-[#E6C79C] text-black' 
                    : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#E6C79C] border-t-transparent animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/10 rounded-3xl border border-red-500/20">
            <h3 className="text-xl font-bold text-red-500 mb-2">악보를 불러오지 못했습니다</h3>
            <p className="text-red-400 max-w-md mx-auto">{error}</p>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Music className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">악보를 찾을 수 없습니다</h3>
            <p className="text-[#A1A1AA]">검색어나 필터를 조정해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSheets.map((sheet) => (
              <div 
                key={sheet.id} 
                onClick={() => setPreviewSheet(sheet)}
                className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,199,156,0.1)] hover:-translate-y-1 flex flex-col pt-1"
              >
                {/* Thumbnail Area */}
                <div className="aspect-[4/5] relative bg-[#0A0A0A] overflow-hidden m-4 rounded-xl border border-white/5 flex items-center justify-center">
                  {sheet.thumbnailUrl ? (
                    <img 
                      src={sheet.thumbnailUrl} 
                      alt={sheet.title} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                  ) : sheet.youtubeId ? (
                    <>
                      <img 
                        src={`https://img.youtube.com/vi/${sheet.youtubeId}/hqdefault.jpg`} 
                        alt={sheet.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <PlayCircle className="w-6 h-6 text-[#E6C79C] fill-[#E6C79C]/20" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  
                  {/* Category/Level Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {sheet.isPremiumOnly && (
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-[#E6C79C] text-black rounded-full shadow-lg">
                        Premium
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="px-6 pb-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-2xl md:text-3xl text-white mb-1 line-clamp-1 tracking-normal leading-tight group-hover:text-[#E6C79C] transition-colors font-handwriting">
                      {sheet.title}
                    </h3>
                    <p className="text-[#A1A1AA] text-sm flex items-center gap-1 font-medium">
                      <Music className="w-3.5 h-3.5" /> {sheet.artistId || '알 수 없는 아티스트'}
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="flex gap-2 mb-4">
                    {sheet.pdfUrl && <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-bold">PDF 악보</span>}
                    {sheet.audioUrl && <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">MR 음원</span>}
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {sheet.bpm && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 text-[#A1A1AA]">
                        <Activity className="w-3 h-3 text-[#E6C79C]" /> {sheet.bpm} BPM
                      </span>
                    )}
                    {sheet.key && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 text-[#A1A1AA]">
                        <Hash className="w-3 h-3 text-[#E6C79C]" /> {sheet.key}
                      </span>
                    )}
                  </div>

                  {/* Footer & Action */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-white">
                        {sheet.price === '0' || sheet.price === '' || !sheet.price ? '무료' : `$${sheet.price}`}
                      </span>
                    </div>
                    
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setPreviewSheet(sheet);
                      }}
                      className="bg-[#E6C79C] text-[#0F0F0F] hover:bg-[#C9A675] rounded-full px-5 transition-all text-sm font-bold"
                    >
                      상세 정보
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {previewSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setPreviewSheet(null)}
          ></div>
          <div className="relative bg-[#0F0F0F] border border-[#27272A] w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#27272A] shrink-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#E6C79C] uppercase mb-1 block">상세 보기</span>
                <h2 className="text-3xl md:text-4xl text-white line-clamp-1 tracking-normal font-handwriting">{previewSheet.title}</h2>
              </div>
              <button 
                onClick={() => setPreviewSheet(null)}
                className="p-2 bg-[#27272A] hover:bg-[#3F3F46] rounded-full text-white transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content - Scrolling Area */}
            <div className="overflow-y-auto p-4 md:p-8 flex-1 custom-scrollbar">
              
              <div className="flex flex-col md:flex-row gap-8 xl:gap-12 max-w-7xl mx-auto">
                 {/* Left Column: Visuals */}
                 <div className="w-full md:w-[180px] lg:w-[220px] shrink-0 space-y-6 mx-auto md:mx-0">
                    {/* Main Thumbnail or YouTube */}
                    <div className={`w-full ${previewSheet.thumbnailUrl ? 'aspect-[1/1.414]' : 'aspect-video'} rounded-2xl overflow-hidden bg-[#0A0A0A] border border-[#27272A] shadow-xl relative flex items-center justify-center`}>
                      {previewSheet.thumbnailUrl ? (
                         <img src={previewSheet.thumbnailUrl} alt={previewSheet.title} className="w-full h-full object-contain opacity-95 hover:opacity-100 transition-opacity" />
                      ) : previewSheet.youtubeId ? (
                         <img src={`https://img.youtube.com/vi/${previewSheet.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-[#71717A]">
                            <LayoutGrid className="w-16 h-16 mb-4 opacity-50" />
                            <span className="text-sm font-bold tracking-widest uppercase">No Visuals</span>
                         </div>
                      )}
                    </div>

                    {/* Meta Basic Info */}
                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#27272A]">
                      <h3 className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider mb-4 border-b border-[#27272A] pb-2">기본 정보</h3>
                      <div className="space-y-3">
                         <div className="flex justify-between">
                            <span className="text-[#71717A]">아티스트/편곡자</span>
                            <span className="text-white font-medium">{previewSheet.artistId || '-'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-[#71717A]">BPM</span>
                            <span className="text-white font-medium">{previewSheet.bpm || '-'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-[#71717A]">Key</span>
                            <span className="text-white font-medium">{previewSheet.key || '-'}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-[#71717A]">가격</span>
                            <span className="text-[#E6C79C] font-black">{previewSheet.price === '0' || !previewSheet.price ? '무료' : `$${previewSheet.price}`}</span>
                         </div>
                      </div>
                      
                      {previewSheet.moodTags && previewSheet.moodTags.length > 0 && (
                         <div className="mt-6 flex flex-wrap gap-2">
                           {previewSheet.moodTags.map(tag => (
                              <span key={tag} className="px-3 py-1 bg-[#27272A] text-[#A1A1AA] rounded-md text-xs font-medium border border-[#3F3F46]">#{tag.trim()}</span>
                           ))}
                         </div>
                      )}
                    </div>
                 </div>

                 {/* Right Column: Files & Playback */}
                 <div className="flex-1 min-w-0 space-y-6">
                    {previewSheet.youtubeId && (
                      <div className="bg-black border border-[#27272A] rounded-2xl overflow-hidden shadow-lg">
                        <div className="px-4 py-3 bg-[#1A1A1A] border-b border-[#27272A] flex items-center gap-2">
                           <PlayCircle className="w-4 h-4 text-red-500" />
                           <span className="text-sm font-bold text-white uppercase tracking-wider">영상 미리보기</span>
                        </div>
                        <div className="aspect-video w-full relative">
                           <iframe
                             src={`https://www.youtube.com/embed/${previewSheet.youtubeId}?rel=0`}
                             title="YouTube Preview"
                             frameBorder="0"
                             allowFullScreen
                             className="absolute inset-0 w-full h-full"
                           ></iframe>
                        </div>
                      </div>
                    )}

                    {/* PDF Sheet Box */}
                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border-l-4 border-[#1A1A1A] border-l-green-500 shadow-lg flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex shrink-0 items-center justify-center">
                         <FileText className="w-8 h-8 text-green-400"/>
                      </div>
                       <div className="flex-1">
                         <h4 className="text-white font-bold text-lg mb-1">PDF 악보</h4>
                         <p className="text-xs text-[#A1A1AA]">인쇄 가능한 고화질 악보</p>
                      </div>
                      <Button 
                        disabled={!previewSheet.pdfUrl}
                        onClick={() => window.open(previewSheet.pdfUrl, '_blank')} 
                        className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 rounded-xl px-4 shrink-0 transition-colors font-bold flex gap-2"
                      >
                         {previewSheet.pdfUrl ? <><Download className="w-4 h-4"/> 열기 / 저장</> : '준비 중'}
                      </Button>
                    </div>

                    {/* MR Audio Box */}
                    <div className="bg-[#1A1A1A] p-6 rounded-2xl border-l-4 border-[#1A1A1A] border-l-blue-500 shadow-lg">
                      <div className="flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex shrink-0 items-center justify-center">
                           <Music className="w-8 h-8 text-blue-400"/>
                        </div>
                        <div className="flex-1">
                           <h4 className="text-white font-bold text-lg mb-1">MR 음원</h4>
                           <p className="text-xs text-[#A1A1AA]">고음질 반주 음원 파일</p>
                        </div>
                        <Button 
                          disabled={!previewSheet.audioUrl}
                          onClick={() => {
                            if(previewSheet.audioUrl) {
                              const a = document.createElement('a');
                              a.href = previewSheet.audioUrl;
                              a.download = `${previewSheet.title}_MR.mp3`;
                              a.target = '_blank';
                              a.click();
                            }
                          }}
                          className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl px-4 shrink-0 transition-colors font-bold flex gap-2"
                        >
                           {previewSheet.audioUrl ? <><Download className="w-4 h-4"/> 음원 다운로드</> : '준비 중'}
                        </Button>
                      </div>

                      {/* Explicit Audio Player for MR */}
                      {previewSheet.audioUrl && (
                        <div className="bg-[#0A0A0A] border border-[#27272A] p-3 rounded-xl">
                          <audio controls className="w-full h-10 outline-none" controlsList="nodownload">
                            <source src={previewSheet.audioUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
