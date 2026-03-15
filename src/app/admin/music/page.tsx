'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { getCollectionDocs, addDocument, createOrUpdateDoc, deleteDocument } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { MusicAlbum, Track, TrackVersion, TrackCredit } from '@/types/music';
import { Plus, Trash2, Save, Music, ChevronRight, CheckCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import Image from 'next/image';
// @ts-ignore
const jsmediatags = typeof window !== 'undefined' ? require('jsmediatags/dist/jsmediatags.min.js') : null;

export default function AdminMusicPage() {
  useAuth();
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor State
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Single' | 'EP' | 'Album'>('Single');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  
  // Cover Handling
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');

  // Tracks Handling
  const [tracks, setTracks] = useState<Track[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const data = await getCollectionDocs<MusicAlbum>('music', []);
      data.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      setAlbums(data);
    } catch (e) {
      console.error(e);
      alert('데이터를 불러오지 못했습니다. 관리자 권한을 확인해주세요.');
    }
    setLoading(false);
  };

  const handleCreateNew = () => {
    setCurrentId('new');
    setTitle('');
    setType('Single');
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setCoverFile(null);
    setExistingCoverUrl('');
    setTracks([{
      id: `tr-${Date.now()}`,
      title: '',
      duration: '',
      credits: { composer: '', arranger: '', instruments: '', producer: '' },
      versions: [{ lang: 'ko', title: '', audioUrl: '', lyrics: '', vocal: '' }]
    }]);
  };

  const selectAlbum = (album: MusicAlbum) => {
    setCurrentId(album.id || null);
    setTitle(album.title);
    setType(album.type);
    setReleaseDate(album.releaseDate);
    setDescription(album.description);
    setExistingCoverUrl(album.coverUrl);
    setCoverFile(null);
    // Deep clone tracks to avoid immediate mutation
    setTracks(JSON.parse(JSON.stringify(album.tracks || [])));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말로 이 음반을 삭제하시겠습니까?')) return;
    try {
      await deleteDocument('music', id);
      setAlbums(prev => prev.filter(s => s.id !== id));
      if (currentId === id) {
        setCurrentId(null);
      }
    } catch (e: unknown) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !releaseDate) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        coverUrl = await uploadFile(coverFile, `public/music_covers/${Date.now()}_${coverFile.name}`);
      }

      if (!coverUrl) {
         alert('커버 이미지를 등록해주세요.');
         setSaving(false);
         return;
      }

      const albumData: Partial<MusicAlbum> = {
        title,
        type,
        releaseDate,
        description,
        coverUrl,
        tracks,
        createdAt: Date.now(),
      };

      if (currentId && currentId !== 'new') {
        await createOrUpdateDoc('music', currentId, albumData);
      } else {
        await addDocument('music', albumData);
      }

      await fetchAlbums();
      alert('저장되었습니다.');
      setCurrentId(null);
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // --- Track Operations ---
  const addTrack = () => {
    setTracks(prev => [...prev, {
      id: `tr-${Date.now()}`,
      title: '',
      duration: '',
      credits: { composer: '', arranger: '', instruments: '', producer: '' },
      versions: [{ lang: 'ko', title: '', audioUrl: '', lyrics: '', vocal: '' }]
    }]);
  };

  const updateTrack = (trackIndex: number, field: string, value: string | number) => {
    setTracks(prev => {
      const updated = [...prev];
      updated[trackIndex] = { ...updated[trackIndex], [field]: value };
      return updated;
    });
  };

  const updateTrackCredit = (trackIndex: number, field: keyof TrackCredit, value: string) => {
    setTracks(prev => {
      const updated = [...prev];
      updated[trackIndex].credits = { ...updated[trackIndex].credits, [field]: value };
      return updated;
    });
  };

  const removeTrack = (trackIndex: number) => {
    if (!confirm('이 트랙을 삭제하시겠습니까?')) return;
    setTracks(prev => prev.filter((_, i) => i !== trackIndex));
  };

  // --- Version Operations ---
  const addVersion = (trackIndex: number) => {
    setTracks(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[trackIndex].versions.push({ lang: 'en', title: '', audioUrl: '', lyrics: '', vocal: '' });
      return updated;
    });
  };

  const updateVersion = (trackIndex: number, versionIndex: number, field: keyof TrackVersion, value: string) => {
    setTracks(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[trackIndex].versions[versionIndex][field] = value;
      return updated;
    });
  };

  const handleAudioUpload = async (trackIndex: number, versionIndex: number, file: File) => {
     if (!file) return;
     try {
       // Extract metadata
       if (file.type.includes('audio') && jsmediatags) {
         try {
           jsmediatags.read(file, {
             onSuccess: function(tag: any) {
               if (tag.tags.title) {
                 const normalizedTitle = tag.tags.title.normalize('NFC');
                 updateTrack(trackIndex, 'title', normalizedTitle);
                 updateVersion(trackIndex, versionIndex, 'title', normalizedTitle);
                 setTitle(prev => prev || normalizedTitle || ''); // Update Album Title if empty
               } else if (file.name) {
                 const fallbackTitle = file.name.replace(/\.[^/.]+$/, "").normalize('NFC');
                 updateTrack(trackIndex, 'title', fallbackTitle);
                 updateVersion(trackIndex, versionIndex, 'title', fallbackTitle);
                 setTitle(prev => prev || fallbackTitle || '');
               }
               if (tag.tags.picture && !existingCoverUrl && !coverFile) {
                 const data = tag.tags.picture.data;
                 const format = tag.tags.picture.format || 'image/jpeg';
                 let base64String = "";
                 for (let i = 0; i < data.length; i++) {
                   base64String += String.fromCharCode(data[i]);
                 }
                 setCoverFile(new File([new Blob([new Uint8Array(data)], { type: format })], `cover_${Date.now()}.${format.split('/')[1] || 'jpeg'}`, { type: format }));
               }
             },
             onError: function(error: any) {
               console.log('jsmediatags error:', error);
               if (file.name) {
                 const fallbackTitle = file.name.replace(/\.[^/.]+$/, "").normalize('NFC');
                 updateTrack(trackIndex, 'title', fallbackTitle);
                 updateVersion(trackIndex, versionIndex, 'title', fallbackTitle);
                 setTitle(prev => prev || fallbackTitle || '');
               }
             }
           });
           
           const objectUrl = URL.createObjectURL(file);
           const audio = new Audio(objectUrl);
           audio.onloadedmetadata = () => {
             const d = audio.duration;
             if (!isNaN(d)) {
               const min = Math.floor(d / 60);
               const sec = Math.floor(d % 60);
               const durationStr = `${min}:${sec.toString().padStart(2, '0')}`;
               updateTrack(trackIndex, 'duration', durationStr);
             }
             URL.revokeObjectURL(objectUrl);
           };
         } catch(e) {
             console.error('Metadata extraction failed', e);
         }
       }

       const audioUrl = await uploadFile(file, `public/music_audio/${Date.now()}_${file.name}`);
       updateVersion(trackIndex, versionIndex, 'audioUrl', audioUrl);
       alert('음원이 업로드 되었습니다.');
     } catch (err) {
       console.error(err);
       alert('업로드 실패');
     }
  };

  const removeVersion = (trackIndex: number, versionIndex: number) => {
    setTracks(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[trackIndex].versions = updated[trackIndex].versions.filter((_: any, i: number) => i !== versionIndex);
      return updated;
    });
  };


  return (
    <div className="lg:h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6 bg-[#0A0A0A] text-[#F4F4F5] font-sans h-auto">
      
      {/* LEFT PANEL : List of Albums */}
      <div className={`w-full lg:w-1/3 xl:w-[450px] flex-col bg-[#141414] border border-[#27272A] rounded-3xl lg:rounded-2xl overflow-hidden shadow-2xl ${currentId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-5 border-b border-[#27272A] bg-[#1A1A1A] flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Music className="w-5 h-5 text-[#E6C79C]"/> 앨범 목록
             </h2>
             <span className="text-xs bg-[#27272A] px-2 py-1 rounded-md text-[#A1A1AA]">{albums.length} 개</span>
          </div>
          <Button variant="secondary" onClick={handleCreateNew} className="w-full hover:bg-[#D4A373] font-bold rounded-xl py-3 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4"/> 새 음반 추가
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-[50vh] lg:min-h-0 hide-scrollbar">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#A1A1AA]"/></div>
          ) : albums.length === 0 ? (
             <p className="text-center text-[#71717A] py-10 text-sm">음반이 없습니다.</p>
          ) : (
            albums.map(album => (
              <div 
                key={album.id} 
                onClick={() => selectAlbum(album)}
                className={`p-3 rounded-2xl lg:rounded-xl border cursor-pointer transition-all flex gap-4 ${currentId === album.id ? 'bg-[#27272A] border-[#E6C79C]/50 shadow-lg' : 'bg-transparent border-[#27272A]/50 hover:bg-[#1A1A1A] hover:border-[#27272A]'}`}
              >
                <div className="w-16 h-16 rounded-xl bg-black border border-[#3F3F46] flex shrink-0 items-center justify-center overflow-hidden relative">
                  {album.coverUrl ? <Image src={album.coverUrl} alt={album.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover"/> : <ImageIcon className="w-5 h-5 text-[#71717A]"/>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] text-[#C48C5E] font-bold uppercase mb-1">{album.type}</span>
                  <h4 className="text-white font-bold text-[15px] lg:text-sm truncate leading-tight">{album.title}</h4>
                  <p className="text-xs text-[#A1A1AA] truncate mt-1">출시: {album.releaseDate}</p>
                </div>
                <button onClick={(e) => handleDelete(album.id!, e)} className="p-3 text-[#71717A] hover:text-red-400 hover:bg-red-400/10 rounded-xl shrink-0 self-center">
                  <Trash2 className="w-5 h-5"/>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL : Editor Form */}
      <div className={`flex-1 bg-[#141414] border border-[#27272A] rounded-3xl lg:rounded-2xl overflow-hidden shadow-2xl flex-col ${!currentId ? 'hidden lg:flex' : 'flex'}`}>
        {!currentId ? (
           <div className="flex-1 flex flex-col items-center justify-center text-[#71717A]">
              <Music className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">관리할 음반을 선택하거나 새로 추가하세요.</p>
           </div>
        ) : (
           <>
              <div className="px-5 lg:px-8 py-4 border-b border-[#27272A] bg-[#1A1A1A] flex items-center justify-between shrink-0">
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1 lg:hidden">
                     <button onClick={() => setCurrentId(null)} className="text-[#A1A1AA] flex items-center text-sm font-semibold active:text-white">
                       <ChevronRight className="w-4 h-4 rotate-180"/> 뒤로
                     </button>
                   </div>
                   <h2 className="text-xl lg:text-2xl font-black text-white">{currentId === 'new' ? '새 음반 추가' : '음반 정보 수정'}</h2>
                 </div>
                 <Button type="button" onClick={handleSave} disabled={saving} variant="secondary" className="hover:bg-[#D4A373] font-black px-4 md:px-6 rounded-xl shadow-lg shadow-[#E6C79C]/20 text-xs md:text-sm h-10 ml-4 shrink-0">
                    {saving ? <><Loader2 className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 animate-spin"/> 저장 중...</> : <><Save className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2"/> 상단 저장하기</>}
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 lg:p-8 hide-scrollbar space-y-8 pb-32">
                 
                 {/* TRACKS INFO */}
                 <div className="bg-[#1A1A1A] border border-[#27272A] rounded-2xl p-6">
                    <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-6">
                       <h3 className="text-lg font-bold text-white">1. 트랙 관리</h3>
                       <Button size="sm" onClick={addTrack} variant="secondary" className="h-8 text-xs font-bold rounded-lg px-3">
                          <Plus className="w-3 h-3 mr-1"/> 트랙 추가
                       </Button>
                    </div>

                    {tracks.length === 0 ? (
                       <p className="text-center text-[#71717A] py-8 text-sm">등록된 트랙이 없습니다. 트랙을 추가해주세요.</p>
                    ) : (
                       <div className="flex flex-col-reverse gap-12">
                          {tracks.map((track, trackIdx) => (
                             <div key={trackIdx} className="bg-[#0A0A0A] border border-[#3F3F46] rounded-xl p-5 relative">
                                {/* Track Header */}
                                <div className="flex items-center justify-between mb-4">
                                   <h4 className="text-[#E6C79C] font-bold">Track {trackIdx + 1}</h4>
                                   <button onClick={() => removeTrack(trackIdx)} className="text-[#71717A] hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                                </div>
                                
                                {/* Audio File Upload (Moved to top) for the first version */}
                                <div className="mb-6 p-4 border border-dashed border-[#E6C79C]/30 rounded-lg bg-[#E6C79C]/5">
                                   <label className="block text-xs font-bold text-[#E6C79C] uppercase mb-3">음원 파일 업로드 (MP3)</label>
                                   <div className="flex flex-col md:flex-row md:items-center gap-3">
                                      <input type="file" accept="audio/*" onChange={e => handleAudioUpload(trackIdx, 0, e.target.files?.[0] as File)} className="text-sm file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-[#E6C79C] file:text-[#0A0A0A] hover:file:bg-[#D4A373] transition-colors cursor-pointer text-slate-300"/>
                                      {track.versions[0]?.audioUrl ? (
                                         <span className="text-[10px] text-green-400 flex items-center bg-green-400/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3 mr-1"/> 업로드됨</span>
                                      ) : (
                                         <span className="text-[10px] text-red-400">음원 없음</span>
                                      )}
                                   </div>
                                   <p className="text-[10px] text-[#A1A1AA] mt-2">파일을 업로드하면 제목, 길이, 커버 이미지가 자동입력됩니다.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                   <div>
                                      <label className="block text-[10px] text-[#A1A1AA] uppercase mb-1">트랙 기본 제목</label>
                                      <input value={track.title} onChange={e => updateTrack(trackIdx, 'title', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-white outline-none focus:border-[#E6C79C]"/>
                                   </div>
                                   <div>
                                      <label className="block text-[10px] text-[#A1A1AA] uppercase mb-1">길이 (예: 5:30)</label>
                                      <input value={track.duration} onChange={e => updateTrack(trackIdx, 'duration', e.target.value)} className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#27272A] rounded-lg text-sm text-white outline-none focus:border-[#E6C79C]"/>
                                   </div>
                                </div>

                                {/* Track Credits */}
                                <div className="mb-6 bg-[#1A1A1A] rounded-lg p-4 border border-[#27272A]">
                                   <label className="block text-[10px] text-white font-bold uppercase mb-3">크레딧 (옵션)</label>
                                   <div className="grid grid-cols-2 gap-3">
                                      <input placeholder="작사/작곡 (Words & Music)" value={track.credits.composer || ''} onChange={e => updateTrackCredit(trackIdx, 'composer', e.target.value)} className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C]"/>
                                      <input placeholder="편곡 (Arranger)" value={track.credits.arranger || ''} onChange={e => updateTrackCredit(trackIdx, 'arranger', e.target.value)} className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C]"/>
                                      <input placeholder="연주 (Instruments)" value={track.credits.instruments || ''} onChange={e => updateTrackCredit(trackIdx, 'instruments', e.target.value)} className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C]"/>
                                      <input placeholder="제작 (Producer)" value={track.credits.producer || ''} onChange={e => updateTrackCredit(trackIdx, 'producer', e.target.value)} className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C]"/>
                                   </div>
                                </div>

                                {/* Track Versions */}
                                <div>
                                   <div className="flex items-center justify-between mb-3">
                                      <h5 className="text-xs font-bold text-white uppercase">버전 및 음원 (언어별)</h5>
                                      <button type="button" onClick={() => addVersion(trackIdx)} className="text-[10px] flex items-center text-[#E6C79C] hover:underline"><Plus className="w-3 h-3 mr-0.5"/> 언어 추가</button>
                                   </div>
                                   
                                   <div className="space-y-4">
                                      {track.versions.map((version, verIdx) => (
                                         <div key={verIdx} className="bg-[#1A1A1A] border-l-2 border-[#E6C79C] pl-4 py-3 pr-3 relative">
                                            {track.versions.length > 1 && (
                                               <button onClick={() => removeVersion(trackIdx, verIdx)} className="absolute top-2 right-2 text-[#71717A] hover:text-red-400"><XIcon className="w-3 h-3"/></button>
                                            )}
                                            <div className="grid grid-cols-3 gap-3 mb-3 pr-4">
                                               <select value={version.lang} onChange={e => updateVersion(trackIdx, verIdx, 'lang', e.target.value)} className="col-span-1 px-2 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none">
                                                  <option value="ko">한국어 (ko)</option>
                                                  <option value="en">English (en)</option>
                                                  <option value="es">Español (es)</option>
                                               </select>
                                               <input placeholder="버전별 곡 제목" value={version.title} onChange={e => updateVersion(trackIdx, verIdx, 'title', e.target.value)} className="col-span-2 px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C]"/>
                                            </div>

                                            {verIdx !== 0 && (
                                                <div className="mb-3">
                                                   <label className="block text-xs font-bold text-[#A1A1AA] mb-2">오디오 음원 (MP3)</label>
                                                   <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                      <input type="file" accept="audio/*" onChange={e => handleAudioUpload(trackIdx, verIdx, e.target.files?.[0] as File)} className="text-sm file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-[#3F3F46] file:text-white hover:file:bg-[#52525B] transition-colors cursor-pointer text-slate-400"/>
                                                      {version.audioUrl ? (
                                                         <span className="text-[10px] text-green-400 flex items-center bg-green-400/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3 mr-1"/> 업로드됨</span>
                                                      ) : (
                                                         <span className="text-[10px] text-red-400">음원 없음</span>
                                                      )}
                                                   </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                               <div>
                                                  <label className="block text-[10px] text-[#A1A1AA] mb-1">가사 (Lyrics)</label>
                                                  <textarea value={version.lyrics} onChange={e => updateVersion(trackIdx, verIdx, 'lyrics', e.target.value)} rows={4} className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C] resize-none" placeholder="엔터로 단락을 구분하세요"/>
                                               </div>
                                               <div>
                                                  <label className="block text-[10px] text-[#A1A1AA] mb-1">해당 버전 보컬 (Vocal)</label>
                                                  <input value={version.vocal || ''} onChange={e => updateVersion(trackIdx, verIdx, 'vocal', e.target.value)} className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-xs text-white outline-none focus:border-[#E6C79C] mb-2"/>
                                                  
                                                  <div className="text-[10px] text-[#A1A1AA] bg-[#27272A]/50 p-2 rounded-md leading-relaxed mt-2">
                                                     <strong>가사 입력 팁:</strong> 단락 구분을 위해 엔터를 두 번 입력하세요. 곡 안에서 줄바꿈은 엔터 한 번입니다.
                                                  </div>
                                               </div>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                </div>

                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* ALBUM INFO */}
                 <div className="bg-[#1A1A1A] border border-[#27272A] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-[#27272A] pb-3">2. 앨범 기본 정보</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       <div className="col-span-1 lg:col-span-2 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-[#A1A1AA] uppercase mb-2">음반 제목 *</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white outline-none focus:border-[#E6C79C]" placeholder="음반 제목"/>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-[#A1A1AA] uppercase mb-2">분류 *</label>
                                <select value={type} onChange={e => setType(e.target.value as 'Single' | 'EP' | 'Album')} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white outline-none focus:border-[#E6C79C]">
                                   <option value="Single">Single (싱글)</option>
                                   <option value="EP">EP (미니앨범)</option>
                                   <option value="Album">Album (정규앨범)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-[#A1A1AA] uppercase mb-2">출시일 (YYYY.MM.DD) *</label>
                                <input value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white outline-none focus:border-[#E6C79C]"/>
                             </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#A1A1AA] uppercase mb-2">간단한 소개 (손글씨 폰트로 노출됨)</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#3F3F46] rounded-xl text-white outline-none focus:border-[#E6C79C] resize-none" placeholder="앨범 소개를 적어주세요..."/>
                          </div>
                       </div>
                       
                       {/* Cover Image Upload */}
                       <div className="col-span-1 border-l-0 lg:border-l border-[#27272A] pt-4 lg:pt-0 lg:pl-6 space-y-4">
                          <label className="block text-xs font-bold text-[#A1A1AA] uppercase mb-2">커버 이미지 (1:1 비율 권장) *</label>
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-full aspect-square max-w-[200px] border-2 border-dashed border-[#3F3F46] rounded-2xl flex items-center justify-center overflow-hidden bg-[#0A0A0A] relative group">
                                {coverFile ? (
                                   <Image src={URL.createObjectURL(coverFile)} alt="Cover preview" fill className="object-cover" unoptimized/>
                                ) : existingCoverUrl ? (
                                   <Image src={existingCoverUrl} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                                ) : (
                                   <ImageIcon className="w-8 h-8 text-[#3F3F46]" />
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <span className="text-white text-xs font-bold">클릭하여 변경</span>
                                </div>
                                <input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer"/>
                             </div>
                             {existingCoverUrl && !coverFile && <p className="text-xs text-green-400"><CheckCircle className="w-3 h-3 inline mr-1"/> 등록된 이미지가 있습니다.</p>}
                          </div>
                       </div>
                    </div>
                 </div>


              </div>

              {/* Action Footer */}
              <div className="absolute lg:static bottom-[80px] lg:bottom-0 left-0 right-0 px-8 py-4 border-t border-[#27272A] bg-[#1A1A1A]/90 backdrop-blur-md flex justify-end gap-3 z-50">
                  <Button type="button" onClick={() => setCurrentId(null)} className="hidden lg:block bg-transparent text-[#A1A1AA] hover:text-white hover:bg-white/5 font-bold">
                     취소
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={saving} variant="secondary" className="hover:bg-[#D4A373] font-black px-10 rounded-xl shadow-lg shadow-[#E6C79C]/20 text-sm h-11">
                     {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> 저장 중...</> : <><Save className="w-5 h-5 mr-2"/> 이대로 음반 저장하기</>}
                  </Button>
              </div>
           </>
        )}
      </div>

    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
