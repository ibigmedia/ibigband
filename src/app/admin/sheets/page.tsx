'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { getCollectionDocs, addDocument, createOrUpdateDoc, deleteDocument, SheetMusic } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { Plus, Edit, Trash2, FileText, Music, Loader2, Video, Save, LayoutGrid, CheckCircle, Search, Activity, Hash, TagIcon, UploadCloud, PlayCircle, ChevronRight, Disc3 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { MusicAlbum } from '@/types/music';

export default function AdminSheetsPage() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedSheet, setSelectedSheet] = useState<SheetMusic | null>(null);

  // Form State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicKey, setMusicKey] = useState('');
  const [moodTags, setMoodTags] = useState('');
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [price, setPrice] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [trackId, setTrackId] = useState('');
  
  // Media Files
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Existing Media URLs
  const [existingPdfUrl, setExistingPdfUrl] = useState('');
  const [existingAudioUrl, setExistingAudioUrl] = useState('');
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick AI
  const [aiLyrics, setAiLyrics] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  useEffect(() => {
    fetchSheets();
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const data = await getCollectionDocs<MusicAlbum>('albums', []);
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAlbums(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const data = await getCollectionDocs<SheetMusic>('sheets', []);
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSheets(data);
    } catch (e) {
      console.error(e);
      alert('데이터를 불러오지 못했습니다. 관리자 권한을 확인해주세요.');
    }
    setLoading(false);
  };

  const handleAITagging = async () => {
    if (!aiLyrics) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/tagging', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ lyrics: aiLyrics, title: title || '가사 분석' })
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.bpm) setBpm(data.data.bpm.toString());
        if (data.data.key) setMusicKey(data.data.key);
        if (data.data.moodTags) setMoodTags(data.data.moodTags.join(', '));
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handlePdfSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    if (!file) return;

    // Automate thumbnail extraction if not explicitly set
    if (!thumbnailFile && !existingThumbnailUrl) {
      setIsGeneratingThumb(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 }); // High-res
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport } as any).promise;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbName = file.name.replace(/\.[^/.]+$/, "") + "_preview.jpg";
            const newThumb = new File([blob], thumbName, { type: 'image/jpeg' });
            setThumbnailFile(newThumb);
          }
        }, 'image/jpeg', 0.8); // 80% quality jpeg
      } catch (err) {
        console.error('PDF to Thumbnail failed', err);
      } finally {
        setIsGeneratingThumb(false);
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedSheet(null);
    setCurrentId(null);
    setTitle('');
    setArtistId('');
    setBpm('');
    setMusicKey('');
    setMoodTags('');
    setIsPremiumOnly(false);
    setPrice('');
    setAlbumId('');
    setTrackId('');
    setPdfFile(null);
    setAudioFile(null);
    setThumbnailFile(null);
    setExistingPdfUrl('');
    setExistingAudioUrl('');
    setExistingThumbnailUrl('');
    setYoutubeId('');
    setAiLyrics('');
  };

  const selectSheet = (sheet: SheetMusic) => {
    setSelectedSheet(sheet);
    setCurrentId(sheet.id || null);
    setTitle(sheet.title || '');
    setArtistId(sheet.artistId || '');
    setBpm(sheet.bpm ? sheet.bpm.toString() : '');
    setMusicKey(sheet.key || '');
    setMoodTags(sheet.moodTags?.join(', ') || '');
    setIsPremiumOnly(sheet.isPremiumOnly || false);
    setPrice(sheet.price || '');
    setAlbumId(sheet.albumId || '');
    setTrackId(sheet.trackId || '');
    
    setExistingPdfUrl(sheet.pdfUrl || '');
    setExistingAudioUrl(sheet.audioUrl || '');
    setExistingThumbnailUrl(sheet.thumbnailUrl || '');
    setYoutubeId(sheet.youtubeId || '');
    
    setPdfFile(null);
    setAudioFile(null);
    setThumbnailFile(null);
    setAiLyrics('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말로 이 항목을 삭제하시겠습니까? 관련 파일은 저장소에 남을 수 있습니다.')) return;
    try {
      await deleteDocument('sheets', id);
      setSheets(prev => prev.filter(s => s.id !== id));
      if (currentId === id) handleCreateNew();
    } catch (e) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('제목(Title)은 필수 항목입니다.');
      return;
    }
    
    setSaving(true);
    try {
      let pdfUrl = existingPdfUrl;
      let audioUrl = existingAudioUrl;
      let thumbnailUrl = existingThumbnailUrl;

      const pathPrefix = isPremiumOnly ? 'premium/sheets' : 'public/sheets';
      
      if (pdfFile) pdfUrl = await uploadFile(pdfFile, `${pathPrefix}/${Date.now()}_${pdfFile.name}`);
      if (audioFile) audioUrl = await uploadFile(audioFile, `${pathPrefix}/${Date.now()}_${audioFile.name}`);
      if (thumbnailFile) thumbnailUrl = await uploadFile(thumbnailFile, `${pathPrefix}/${Date.now()}_${thumbnailFile.name}`);

      const sheetData: Partial<SheetMusic> & { createdAt?: number } = {
        title,
        artistId,
        youtubeId,
        bpm: Number(bpm) || 0,
        key: musicKey,
        moodTags: moodTags.split(',').map(t => t.trim()).filter(Boolean),
        isPremiumOnly,
        price,
        albumId,
        trackId,
      };

      if (pdfUrl) sheetData.pdfUrl = pdfUrl;
      if (audioUrl) sheetData.audioUrl = audioUrl;
      if (thumbnailUrl) sheetData.thumbnailUrl = thumbnailUrl;

      if (currentId) {
        await createOrUpdateDoc('sheets', currentId, sheetData);
      } else {
        sheetData.createdAt = Date.now();
        await addDocument('sheets', sheetData);
      }

      await fetchSheets();
      alert('성공적으로 저장되었습니다.');
      // Keep selecting the newly edited if it was an edit
      if (!currentId) handleCreateNew();
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredSheets = sheets.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.artistId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 bg-[#0A0A0A] text-[#F4F4F5] font-sans h-auto">
      
      {/* LEFT PANEL : List of Sheets (Hide on mobile if editing) */}
      <div className={`w-full lg:w-1/3 lg:w-[400px] flex-col bg-[#141414] border border-[#27272A] rounded-3xl lg:rounded-2xl overflow-hidden shadow-2xl ${currentId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-5 border-b border-[#27272A] bg-[#1A1A1A] flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <LayoutGrid className="w-5 h-5 text-[#E6C79C]"/> 라이브러리 목록
             </h2>
             <span className="text-xs bg-[#27272A] px-2 py-1 rounded-md text-[#A1A1AA]">{sheets.length} 개</span>
          </div>
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"/>
             <input 
               placeholder="검색..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-3 lg:py-2 bg-[#27272A] border border-[#3F3F46] rounded-2xl lg:rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#E6C79C]"
             />
          </div>
          <Button variant="secondary" onClick={() => { handleCreateNew(); setCurrentId('new'); }} className="w-full hover:bg-[#D4A373] font-bold rounded-2xl py-3 lg:py-2 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4"/> 새 콘텐츠 추가
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 p-3 hide-scrollbar min-h-[50vh] lg:min-h-0">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#A1A1AA]"/></div>
          ) : filteredSheets.length === 0 ? (
             <p className="text-center text-[#71717A] py-10 text-sm">항목이 없습니다.</p>
          ) : (
            filteredSheets.map(sheet => (
              <div 
                key={sheet.id} 
                onClick={() => selectSheet(sheet)}
                className={`p-3 rounded-2xl lg:rounded-xl border cursor-pointer transition-all flex gap-3 ${currentId === sheet.id ? 'bg-[#27272A] border-[#E6C79C]/50 shadow-lg' : 'bg-transparent border-[#27272A]/50 hover:bg-[#1A1A1A] hover:border-[#27272A]'}`}
              >
                <div className="w-14 h-14 lg:w-12 lg:h-12 rounded-xl bg-black border border-[#3F3F46] flex shrink-0 items-center justify-center overflow-hidden">
                  {sheet.thumbnailUrl ? <img src={sheet.thumbnailUrl} className="w-full h-full object-cover"/> : <Music className="w-5 h-5 text-[#71717A]"/>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-white font-bold text-[15px] lg:text-sm truncate leading-tight">{sheet.title}</h4>
                  <p className="text-xs text-[#A1A1AA] truncate mt-0.5">{sheet.artistId || 'Unknown Artist'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {sheet.pdfUrl && <span className="w-2 h-2 rounded-full bg-green-500" title="악보 포함"></span>}
                    {sheet.audioUrl && <span className="w-2 h-2 rounded-full bg-blue-500" title="MR 포함"></span>}
                  </div>
                </div>
                <button onClick={(e) => handleDelete(sheet.id!, e)} className="p-3 text-[#71717A] hover:text-red-400 hover:bg-red-400/10 rounded-xl shrink-0 self-center">
                  <Trash2 className="w-5 h-5 lg:w-4 lg:h-4"/>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL : Editor Form (Hide on mobile if NOT editing) */}
      <div className={`flex-1 bg-[#141414] border border-[#27272A] rounded-3xl lg:rounded-2xl overflow-hidden shadow-2xl flex-col ${!currentId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-5 lg:px-8 py-4 border-b border-[#27272A] bg-[#1A1A1A] flex items-center justify-between shrink-0">
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1 lg:hidden">
               <button onClick={handleCreateNew} className="text-[#A1A1AA] flex items-center text-sm font-semibold active:text-white">
                 <ChevronRight className="w-4 h-4 rotate-180"/> 뒤로
               </button>
             </div>
             <h2 className="text-xl lg:text-2xl font-black text-white">{currentId && currentId !== 'new' ? '콘텐츠 수정' : '새 콘텐츠 추가'}</h2>
             <p className="text-xs text-[#A1A1AA] hidden lg:block">악보와 MR(음원)을 구분하여 업로드하고 관리할 수 있습니다.</p>
           </div>
           {currentId && currentId !== 'new' && (
             <span className="hidden lg:flex px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-[#A1A1AA] items-center gap-2">
                ID: {currentId.slice(0, 8)}...
             </span>
           )}
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 hide-scrollbar space-y-12">
           
           {/* Section 1: Basic Info */}
           <section>
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-8 h-8 rounded-full bg-[#E6C79C]/10 flex items-center justify-center border border-[#E6C79C]/30"><FileText className="w-4 h-4 text-[#E6C79C]"/></div>
                 <h3 className="text-lg font-bold text-white">1. 기본 정보</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#1A1A1A] p-6 rounded-2xl border border-[#27272A]">
                 <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">제목 (Title) *</label>
                      <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 어메이징 그레이스 편곡" className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] focus:ring-1 focus:ring-[#E6C79C] transition-all"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">아티스트 / 편곡자</label>
                      <input value={artistId} onChange={e => setArtistId(e.target.value)} placeholder="예: 아이빅밴드" className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] focus:ring-1 focus:ring-[#E6C79C] transition-all"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2 flex justify-between">연관 음반 <Disc3 className="w-3 h-3"/></label>
                        <select value={albumId} onChange={e => { setAlbumId(e.target.value); setTrackId(''); }} className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] transition-all appearance-none cursor-pointer">
                          <option value="">선택 안함</option>
                          {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">연관 곡 (트랙)</label>
                        <select value={trackId} onChange={e => setTrackId(e.target.value)} disabled={!albumId} className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white disabled:opacity-50 focus:outline-none focus:border-[#E6C79C] transition-all appearance-none cursor-pointer">
                          <option value="">선택 안함</option>
                          {albums.find(a => a.id === albumId)?.tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2 flex justify-between">BPM <Activity className="w-3 h-3"/></label>
                        <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="120" className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] transition-all"/>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2 flex justify-between">Key <Hash className="w-3 h-3"/></label>
                        <input value={musicKey} onChange={e => setMusicKey(e.target.value)} placeholder="G" className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] transition-all"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2 flex justify-between">분위기 태그 <TagIcon className="w-3 h-3"/></label>
                      <input value={moodTags} onChange={e => setMoodTags(e.target.value)} placeholder="예: 잔잔한, 어쿠스틱" className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white focus:outline-none focus:border-[#E6C79C] transition-all"/>
                    </div>
                 </div>

                 {/* AI Extraction Row */}
                 <div className="col-span-1 lg:col-span-2 pt-4 border-t border-[#3F3F46]">
                   <label className="block text-xs font-bold text-[#E6C79C] uppercase tracking-wider mb-2">AI 자동 분석 (가사 입력)</label>
                   <div className="flex gap-2">
                     <input value={aiLyrics} onChange={e => setAiLyrics(e.target.value)} placeholder="가사를 붙여넣으면 연관 태그를 자동 추출합니다." className="flex-1 px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-sm text-white focus:outline-none focus:border-[#E6C79C]"/>
                     <Button type="button" onClick={handleAITagging} disabled={aiLoading} className="bg-[#E6C79C]/10 text-[#E6C79C] hover:bg-[#E6C79C]/20 border border-[#E6C79C]/30 rounded-xl whitespace-nowrap">
                       {aiLoading ? '분석 중...' : '자동 생성'}
                     </Button>
                   </div>
                 </div>
              </div>
           </section>

           {/* Section 2: Uploads (Split) */}
           <section>
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30"><UploadCloud className="w-4 h-4 text-blue-400"/></div>
                 <h3 className="text-lg font-bold text-white">2. 파일 관리 (악보 / 음원)</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* SHEET MUSIC SECTION */}
                 <div className="bg-[#1A1A1A] p-6 rounded-2xl border-t-4 border-[#1A1A1A] border-t-green-500 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FileText className="w-24 h-24 text-green-500" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-xl font-black text-white flex items-center gap-2 border-b border-[#3F3F46] pb-4 mb-4">
                        <FileText className="w-5 h-5 text-green-400"/> 파트 악보 섹션
                      </h4>
                      <p className="text-xs text-[#A1A1AA] mb-6">PDF 형식의 악보 파일과 커버 또는 미리보기 썸네일을 업로드하세요.</p>
                      
                      <div className="space-y-5">
                         {/* PDF */}
                         <div>
                            <label className="block text-xs font-bold text-white mb-2">PDF 악보 파일 첨부</label>
                            <input type="file" accept="application/pdf" onChange={handlePdfSelection} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#27272A] file:text-white hover:file:bg-[#3F3F46] text-[#A1A1AA] cursor-pointer" />
                            {existingPdfUrl && !pdfFile && <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 등록된 악보가 있습니다.</p>}
                         </div>
                         {/* Thumbnail */}
                         <div>
                            <label className="block text-xs font-bold text-white mb-2">
                               커버 / 대표 썸네일 (이미지) 
                               {isGeneratingThumb && <span className="ml-2 text-green-400 font-normal"><Loader2 className="w-3 h-3 inline animate-spin"/> 자동 추출 중...</span>}
                            </label>
                            <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#27272A] file:text-white hover:file:bg-[#3F3F46] text-[#A1A1AA] cursor-pointer" />
                            
                            {/* NEW FILE PREVIEW */}
                            {thumbnailFile && (
                               <div className="mt-4 flex items-start gap-4 p-4 bg-[#141414] rounded-xl border border-[#27272A]">
                                  <img src={URL.createObjectURL(thumbnailFile)} className="w-24 h-[135px] rounded-lg object-contain bg-black/50 border border-[#3F3F46]" alt="Thumb Preview" />
                                  <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-xs text-green-400 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> {thumbnailFile.name}</p>
                                    <p className="text-[10px] text-[#A1A1AA]">썸네일 생성 완료. 저장 시 반영됩니다.</p>
                                  </div>
                               </div>
                            )}
                            
                            {/* EXISTING FILE PREVIEW */}
                            {existingThumbnailUrl && !thumbnailFile && (
                               <div className="mt-4 flex items-start gap-4 p-4 bg-[#141414] rounded-xl border border-[#27272A]">
                                  <img src={existingThumbnailUrl} className="w-24 h-[135px] rounded-lg object-contain bg-black/50 border border-[#3F3F46]" alt="Thumb" />
                                  <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-xs text-green-400 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3"/> 등록된 썸네일 이미지</p>
                                    <p className="text-[10px] text-[#A1A1AA]">현재 사용중인 대표 이미지입니다.</p>
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                    </div>
                 </div>

                 {/* MR AUDIO SECTION */}
                 <div className="bg-[#1A1A1A] p-6 rounded-2xl border-t-4 border-[#1A1A1A] border-t-blue-500 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Music className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-xl font-black text-white flex items-center gap-2 border-b border-[#3F3F46] pb-4 mb-4">
                        <PlayCircle className="w-5 h-5 text-blue-400"/> MR / 음원 섹션
                      </h4>
                      <p className="text-xs text-[#A1A1AA] mb-6">MP3/WAV 형식의 재생 가능한 음원을 기록하고 미리보기 영상을 설정합니다.</p>

                      <div className="space-y-5">
                         {/* Audio */}
                         <div>
                            <label className="block text-xs font-bold text-white mb-2">MR 오디오 파일 첨부 (MP3, WAV)</label>
                            <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#27272A] file:text-white hover:file:bg-[#3F3F46] text-[#A1A1AA] cursor-pointer" />
                            {existingAudioUrl && !audioFile && (
                               <div className="mt-2 mt-2">
                                 <p className="text-xs text-blue-400 mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> 등록된 음원이 있습니다.</p>
                                 <audio src={existingAudioUrl} controls className="h-8 w-full"/>
                               </div>
                            )}
                         </div>
                         {/* YouTube */}
                         <div>
                            <label className="block text-xs font-bold text-white mb-2 flex items-center gap-2">
                              YouTube 연주 영상 (ID 값)
                            </label>
                            <input value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="예: dQw4w9WgXcQ" className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-sm text-white focus:outline-none focus:border-red-500 transition-all"/>
                            {youtubeId && (
                               <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                 <Video className="w-3 h-3"/> 유튜브 연동 활성화
                               </div>
                            )}
                         </div>
                      </div>
                    </div>
                 </div>

              </div>
           </section>

           {/* Section 3: Pricing & Check */}
           <section>
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-[#27272A] flex flex-col lg:flex-row items-center justify-between gap-6">
                 <div className="flex-1 space-y-2">
                    <h4 className="text-sm font-bold text-white">가격 설정 (USD)</h4>
                    <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00 (무료)" className="w-full lg:w-32 px-4 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white text-center focus:outline-none focus:border-[#E6C79C]"/>
                 </div>
                 <div className="flex-1 flex items-center justify-end">
                    <label className="flex items-center cursor-pointer p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl hover:border-[#E6C79C]/50 transition-colors">
                      <input type="checkbox" checked={isPremiumOnly} onChange={e => setIsPremiumOnly(e.target.checked)} className="w-5 h-5 accent-[#E6C79C] cursor-pointer" />
                      <span className="ml-3 text-sm font-bold text-[#E6C79C]">프리미엄 콘텐츠 (회원 전용)</span>
                    </label>
                 </div>
              </div>
           </section>

           <div className="h-10"></div> {/* Bottom Padding */}
        </form>

        {/* Action Footer */}
        <div className="px-8 py-5 border-t border-[#27272A] bg-[#1A1A1A] flex justify-end gap-3 shrink-0">
            <Button type="button" onClick={handleCreateNew} className="bg-transparent text-[#A1A1AA] hover:text-white hover:bg-white/5 font-bold">
               취소 및 초기화
            </Button>
            <Button type="submit" variant="secondary" onClick={handleSave} disabled={saving} className="hover:bg-[#D4A373] font-black px-10 rounded-xl shadow-lg shadow-[#E6C79C]/20">
               {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> 저장 중...</> : <><Save className="w-5 h-5 mr-2"/> 이대로 저장하기 (저장 완료 후 클릭)</>}
            </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
