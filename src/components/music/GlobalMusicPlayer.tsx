'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Play, Pause, X, Globe2, ChevronRight, Users, Mic2, Disc, Languages, SkipBack, SkipForward, FileText } from 'lucide-react';
import { useMusicStore } from '@/store/useMusicStore';
import { Track, MusicAlbum } from '@/types/music';
import { getCollectionDocs } from '@/lib/firebase/firestore';

const langNames = {
  ko: '한국어',
  en: 'English',
  es: 'Español'
};

function activeLanguage(track: Track, lang: 'ko' | 'en' | 'es'): 'ko' | 'en' | 'es' {
   if (track.versions.some(v => v.lang === lang)) return lang;
   return track.versions[0].lang as 'ko' | 'en' | 'es';
}

export default function GlobalMusicPlayer() {
  const [showLyricsMobile, setShowLyricsMobile] = useState(false);
  const {
    albums,
    selectedAlbum,
    activeTrack,
    activeLang,
    isPlaying,
    progress,
    lyricsScale,
    setIsPlaying,
    setProgress,
    setActiveTrack,
    setActiveLang,
    setLyricsScale,
    openAlbumModal,
    closeAlbumModal,
    stopPlayback,
    setAlbums
  } = useMusicStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Global fetch for albums
  useEffect(() => {
    async function fetchAlbums() {
      if (albums.length > 0) return;
      try {
        const data = await getCollectionDocs<MusicAlbum>('music', []);
        data.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setAlbums(data); // Removed MOCK_ALBUMS fallback to avoid dependency missing
      } catch (e) {
        console.error("Failed to fetch music albums:", e);
      }
    }
    fetchAlbums();
  }, [albums.length, setAlbums]);

  let currentVersion = activeTrack?.versions.find(v => v.lang === activeLang);
  if (!currentVersion && activeTrack) {
    currentVersion = activeTrack.versions[0];
  }

  // Handle Play/Pause logic when state changes
  useEffect(() => {
    if (audioRef.current && currentVersion) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentVersion?.audioUrl]); // Must react to audioUrl changes

  // Auto-play when track changes (wait for duration/load handled by useEffect above)
  useEffect(() => {
    if (audioRef.current && currentVersion) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      }
    }
  }, [currentVersion]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const handleTrackSelect = (track: Track) => {
    if (activeTrack?.id === track.id) {
       togglePlay();
       return;
    }
    setActiveTrack(track);
    if (!track.versions.some(v => v.lang === activeLang)) {
       setActiveLang(track.versions[0].lang);
    }
    setProgress(0);
    setIsPlaying(true);
  };

  const renderLyrics = (lyrics?: string) => {
    if (!lyrics) return null;
    return lyrics.split('\n\n').map((paragraph, i) => (
      <p key={i} className="mb-4 lg:mb-6 text-slate-700">
        {paragraph.split('\n').map((line, j) => (
          <span key={j} className="block">{line}</span>
        ))}
      </p>
    ));
  };

  const activeTrackAlbum = activeTrack ? albums.find(a => a.tracks.some(t => t.id === activeTrack.id)) : null;

  const albumIndex = activeTrackAlbum ? albums.findIndex(a => a.id === activeTrackAlbum.id) : -1;
  const trackIndex = (activeTrackAlbum && activeTrack) ? activeTrackAlbum.tracks.findIndex(t => t.id === activeTrack.id) : -1;
  const hasPrevTrack = albumIndex !== -1 && trackIndex !== -1 && (trackIndex > 0 || albumIndex > 0);
  const hasNextTrack = albumIndex !== -1 && trackIndex !== -1 && activeTrackAlbum && (trackIndex < (activeTrackAlbum.tracks.length - 1) || albumIndex < (albums.length - 1));

  const playNextTrack = () => {
    if (!activeTrackAlbum) return;
    const albumIndex = albums.findIndex(a => a.id === activeTrackAlbum.id);
    if (albumIndex === -1) return;
    
    const trackIndex = activeTrackAlbum.tracks.findIndex(t => t.id === activeTrack?.id);
    
    // Next track in same album
    if (trackIndex < activeTrackAlbum.tracks.length - 1) {
      handleTrackSelect(activeTrackAlbum.tracks[trackIndex + 1]);
    } 
    // First track of next album (next in the list is an older album)
    else if (albumIndex < albums.length - 1) {
      const nextAlbum = albums[albumIndex + 1];
      if (nextAlbum.tracks.length > 0) {
        handleTrackSelect(nextAlbum.tracks[0]);
      }
    }
  };

  const playPrevTrack = () => {
    if (!activeTrackAlbum) return;
    const albumIndex = albums.findIndex(a => a.id === activeTrackAlbum.id);
    if (albumIndex === -1) return;
    
    const trackIndex = activeTrackAlbum.tracks.findIndex(t => t.id === activeTrack?.id);
    
    // Prev track in same album
    if (trackIndex > 0) {
      handleTrackSelect(activeTrackAlbum.tracks[trackIndex - 1]);
    } 
    // Last track of previous album (prev in the list is a newer album)
    else if (albumIndex > 0) {
      const prevAlbum = albums[albumIndex - 1];
      if (prevAlbum.tracks.length > 0) {
        handleTrackSelect(prevAlbum.tracks[prevAlbum.tracks.length - 1]);
      }
    }
  };

  // Spacebar playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      // Only toggle if player modal is open
      if (e.code === 'Space' && selectedAlbum !== null) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedAlbum, togglePlay]);

  return (
    <>
      <audio 
         ref={audioRef} 
         onTimeUpdate={handleTimeUpdate}
         onEnded={() => setIsPlaying(false)}
      >
        {currentVersion && <source src={currentVersion.audioUrl} />}
      </audio>

      
      {/* ALBUM MODAL OVERLAY */}
      {selectedAlbum && activeTrack && currentVersion && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center md:pt-16 pb-0 md:p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeAlbumModal}
        >
          <div 
            className="w-full h-full max-w-[1280px] bg-white md:rounded-[40px] relative overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-500 transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Close Modal Button */}
             <button 
               onClick={closeAlbumModal}
               className="absolute top-4 right-4 z-50 w-10 h-10 md:w-12 md:h-12 bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-100 text-slate-800 rounded-full flex justify-center items-center transition-all duration-300"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Modal Content - Scrollable on mobile, flex-row on desktop */}
             <div className="flex flex-col lg:flex-row w-full h-full overflow-y-auto lg:overflow-hidden">
                
                {/* LEFT: Album Info and Tracks (Mobile: Stacked, Desktop: Split or single col) */}
                {/* Making it 2 columns on lg, 1 column on md */}
                <div className="lg:w-5/12 flex flex-col md:flex-row lg:flex-col bg-[#FDFCFB] border-b lg:border-b-0 lg:border-r border-slate-100 relative shrink-0 h-auto lg:h-full">
                   <div className="flex flex-col w-full h-full lg:overflow-y-auto hide-scrollbar">
                      
                      {/* Album Info Section */}
                      <div className="p-6 md:p-10 flex flex-col sm:flex-row lg:flex-col gap-6 lg:gap-8 items-start">
                         <div className="flex flex-col lg:flex-row gap-6 w-full items-center lg:items-end">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-40 lg:h-40 aspect-square rounded-[24px] overflow-hidden shadow-lg relative shrink-0 mx-auto sm:mx-0">
                               <Image src={selectedAlbum.coverUrl} alt={selectedAlbum.title} fill className="object-cover" sizes="(max-width: 768px) 128px, 160px" />
                            </div>
                            
                            {/* PC Only: Track Credits */}
                            <div className="hidden lg:flex flex-col flex-1 mb-2 bg-slate-50 border border-slate-100 p-4 rounded-2xl w-full">
                               <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">Track Credits</h4>
                               {activeTrack.credits && Object.values(activeTrack.credits).some(v => v) ? (
                                 <div className="flex flex-col gap-1.5 text-xs">
                                   {activeTrack.credits.producer && <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Producer</span><span className="text-right text-slate-700 truncate font-semibold">{activeTrack.credits.producer}</span></div>}
                                   {activeTrack.credits.composer && <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Composer</span><span className="text-right text-slate-700 truncate font-semibold">{activeTrack.credits.composer}</span></div>}
                                   {activeTrack.credits.arranger && <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Arranger</span><span className="text-right text-slate-700 truncate font-semibold">{activeTrack.credits.arranger}</span></div>}
                                 </div>
                               ) : (
                                 <span className="text-xs text-slate-400 italic">No credits provided.</span>
                               )}
                            </div>
                         </div>
                         <div className="flex-1 text-center sm:text-left lg:text-left flex flex-col w-full">
                            <span className="text-[#C48C5E] text-[10px] font-bold uppercase tracking-widest block mb-2 border border-[#C48C5E]/30 bg-[#C48C5E]/5 px-3 py-1 rounded-full w-max mx-auto sm:mx-0">
                               {selectedAlbum.type}
                            </span>
                            <h2 className="text-3xl md:text-5xl lg:text-4xl font-handwriting text-slate-900 leading-tight mb-3">{selectedAlbum.title}</h2>
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 md:line-clamp-none mb-4 lg:mb-0 lg:leading-loose">{selectedAlbum.description}</p>
                            
                            {/* Mobile Play/Pause & Language Controls */}
                            <div className="flex flex-col w-full lg:hidden mt-2 gap-4">
                               <div className="flex items-center gap-4">
                                  <button 
                                    onClick={togglePlay}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#C48C5E] text-white flex items-center justify-center active:scale-95 transition-all shadow-[0_4px_15px_rgba(196,140,94,0.4)] shrink-0"
                                  >
                                    {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />}
                                  </button>
                                  
                                  <div className="flex flex-col min-w-0 flex-1 opacity-90">
                                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Now Playing</span>
                                     <h3 className="font-handwriting text-2xl sm:text-3xl text-slate-900 truncate">{currentVersion.title.normalize('NFC')}</h3>
                                  </div>
                               </div>

                               {activeTrack.versions.length > 1 && (
                                  <div className="flex bg-slate-100/80 p-1 rounded-2xl w-fit">
                                    {activeTrack.versions.map((ver) => (
                                      <button
                                        key={ver.lang}
                                        onClick={() => { setActiveLang(ver.lang); setProgress(0); }}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                                          activeLang === ver.lang ? 'bg-white text-[#C48C5E] shadow-sm' : 'text-slate-500'
                                        }`}
                                      >
                                         {langNames[ver.lang]}
                                      </button>
                                    ))}
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Tracklist Section */}
                      <div className="px-4 md:px-8 pb-6 flex-1">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Tracklist</h3>
                         <div className="flex flex-col gap-1">
                            {selectedAlbum.tracks.map((track, i) => {
                              const isActive = activeTrack.id === track.id;
                              return (
                                <div 
                                  key={track.id} 
                                  onClick={() => handleTrackSelect(track)}
                                  className={`flex items-center gap-3 py-2 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                                    isActive 
                                      ? 'bg-[#C48C5E] text-white shadow-md transform scale-[1.02]' 
                                      : 'hover:bg-white text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-100'
                                  }`}
                                >
                                   <div className={`w-5 text-center font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                     {isActive && isPlaying ? <Play className="w-4 h-4 mx-auto fill-current animate-pulse"/> : `${i+1}`}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className={`font-handwriting font-normal text-xl md:text-2xl leading-none truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{track.title?.normalize('NFC') || track.title}</p>
                                      {track.versions.length > 1 && !isActive && (
                                         <p className="text-[10px] text-slate-400 md:font-medium mt-1">{track.versions.length} versions</p>
                                      )}
                                   </div>
                                   <div className={`text-xs font-medium pl-2 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{track.duration}</div>
                                </div>
                              )
                            })}
                         </div>
                      </div>

                      {/* Mobile View Lyrics Button (Replaces Credits entirely) */}
                      <div className="px-6 md:px-8 pb-8 lg:hidden shrink-0">
                         <button 
                           onClick={() => setShowLyricsMobile(true)}
                           className="w-full py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm"
                         >
                            <FileText className="w-5 h-5 text-[#C48C5E]"/> 가사 보기 (Lyrics)
                         </button>
                      </div>

                   </div>
                </div>

                {/* RIGHT: Now Playing & Lyrics (Desktop Only) */}
                <div className="hidden lg:flex w-7/12 flex-col h-full relative overflow-hidden bg-white z-10">
                   <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
                      <Image src={selectedAlbum.coverUrl} alt="bg" fill className="object-cover blur-[80px]" />
                   </div>
                   
                   {/* Now Playing Header (Sticky on mobile) */}
                   <div className="sticky top-0 z-30 px-6 py-5 md:px-10 md:py-8 bg-white/95 backdrop-blur-xl border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-6 shadow-sm lg:shadow-none">
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#C48C5E] font-bold tracking-widest text-[10px] uppercase">Now Playing</span>
                            <span className="hidden lg:flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                               <kbd className="font-sans font-bold border border-slate-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.1)] px-1.5 pb-[2px] bg-white text-slate-600 leading-none">Space</kbd>
                               스페이스바로 재생
                            </span>
                         </div>
                         <h2 className="text-slate-900 text-3xl md:text-4xl lg:text-4xl leading-tight font-handwriting flex items-center lg:items-baseline flex-wrap gap-x-3 gap-y-1">
                            <span className="text-slate-400 font-bold truncate max-w-[200px] xl:max-w-[280px]" title={selectedAlbum.title}>{selectedAlbum.title}</span>
                            <span className="text-slate-300 hidden lg:inline-block font-sans text-2xl font-light">/</span>
                            <span className="text-slate-900">{currentVersion.title.normalize('NFC')}</span>
                         </h2>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap pb-2 md:pb-0">
                         {activeTrack.versions.length > 1 && (
                           <div className="flex bg-slate-100 p-1.5 rounded-2xl relative shadow-inner">
                             <div className="absolute inset-y-1.5 bg-white rounded-[10px] shadow-sm transition-all duration-300" style={{
                                width: `calc(100% / ${activeTrack.versions.length} - 12px)`,
                                left: `calc((100% / ${activeTrack.versions.length}) * ${activeTrack.versions.findIndex(v => v.lang === activeLang)} + 6px)`
                             }}></div>
                             {activeTrack.versions.map((ver) => (
                               <button
                                 key={ver.lang}
                                 onClick={() => {
                                   setActiveLang(ver.lang);
                                   setProgress(0);
                                 }}
                                 className={`relative z-10 px-4 py-2 flex items-center gap-2 rounded-[10px] text-xs font-bold transition-all duration-300 ${
                                   activeLang === ver.lang ? 'text-[#C48C5E]' : 'text-slate-500 hover:text-slate-800'
                                 }`}
                               >
                                  {activeLang === ver.lang && <Languages className="w-4 h-4"/>}
                                  {langNames[ver.lang]}
                               </button>
                             ))}
                           </div>
                         )}
                         
                         <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 ml-auto md:ml-2 hidden sm:flex">
                            <button onClick={() => setLyricsScale(Math.max(0.6, lyricsScale - 0.2))} className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-[10px] transition-colors">A-</button>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <button onClick={() => setLyricsScale(Math.min(2.0, lyricsScale + 0.2))} className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-[10px] transition-colors">A+</button>
                         </div>

                         <button 
                           onClick={togglePlay}
                           className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C48C5E]/30 shrink-0"
                         >
                           {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-1" />}
                         </button>
                      </div>
                   </div>
                   
                   <div className="relative z-30 w-full h-1 bg-slate-100">
                      <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full" style={{ width: `${progress}%` }}></div>
                   </div>

                   {/* Lyrics Text */}
                   <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-10 lg:p-14 pb-32 mask-image-y min-h-[300px]">
                      <div 
                        className="text-slate-800 font-handwriting font-normal tracking-wide antialiased transition-all duration-300 transform-gpu"
                        style={{ 
                           fontSize: `calc(${1.2 * lyricsScale}rem + 0.8vw)`, 
                           lineHeight: 1.25
                        }}
                      >
                        {renderLyrics(currentVersion.lyrics)}
                      </div>
                   </div>
                </div>
             </div>
             
             {/* 📱 MOBILE LYRICS OVERLAY */}
             {showLyricsMobile && (
               <div 
                 className="fixed inset-0 z-[120] lg:hidden bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-300"
                 onClick={() => setShowLyricsMobile(false)}
               >
                 <div 
                   className="w-full h-[85vh] bg-[#FDFCFB] rounded-t-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300 transform-gpu"
                   onClick={e => e.stopPropagation()}
                 >
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md rounded-t-[32px]">
                       <div>
                          <p className="text-[10px] font-bold text-[#C48C5E] tracking-widest uppercase mb-0.5">가사 (Lyrics)</p>
                          <h3 className="text-2xl font-handwriting text-slate-900 leading-none">{currentVersion.title.normalize('NFC')}</h3>
                       </div>
                       <button onClick={() => setShowLyricsMobile(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                          <X className="w-5 h-5"/>
                       </button>
                    </div>
                    

                    <div className="flex-1 overflow-y-auto hide-scrollbar p-6 md:p-8 pb-20 scroll-smooth">
                       <div className="text-slate-800 font-handwriting font-normal" style={{ fontSize: `calc(${1.2 * lyricsScale}rem + 1vw)`, lineHeight: 1.35 }}>
                          {renderLyrics(currentVersion.lyrics)}
                       </div>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* MINI PLAYER */}
      {!selectedAlbum && activeTrack && currentVersion && activeTrackAlbum && (
         <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 md:px-8 py-4 z-[90] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center gap-4 cursor-pointer group flex-1 min-w-0" onClick={() => openAlbumModal(activeTrackAlbum, currentVersion.lang)}>
               <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden relative shadow-sm shrink-0">
                  <Image src={activeTrackAlbum.coverUrl} alt="cover" fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="56px" />
               </div>
               <div className="flex flex-col min-w-0 flex-1 relative overflow-hidden h-[45px] md:h-[50px] justify-center mask-image-x">
                  <div className="animate-marquee w-max flex items-center h-full">
                     {[1, 2].map((i) => (
                       <div key={i} className="flex items-center gap-8 md:gap-12 shrink-0 pr-8 md:pr-12">
                          <div className="flex items-baseline gap-2 shrink-0">
                            <h4 className="font-handwriting text-2xl md:text-3xl font-bold text-slate-800 leading-none group-hover:text-[#C48C5E] transition-colors">{currentVersion.title?.normalize('NFC') || currentVersion.title}</h4>
                            <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C48C5E] font-bold hidden md:inline-block">앨범 보기 〉</span>
                          </div>
                          {activeTrackAlbum.description && (
                             <span className="text-slate-600 text-[20px] md:text-[24px] font-handwriting leading-none shrink-0 tracking-wide mt-1 hidden md:inline-block">
                                {activeTrackAlbum.description?.normalize('NFC') || activeTrackAlbum.description}
                             </span>
                          )}
                          {(activeTrack.credits.composer || activeTrack.credits.arranger || activeTrack.credits.producer || currentVersion.vocal) && (
                             <span className="text-slate-500 text-[22px] md:text-[26px] font-handwriting leading-none shrink-0 tracking-wide mt-1 hidden md:inline-block">
                                {[
                                  activeTrack.credits.composer ? `작곡: ${activeTrack.credits.composer}` : null,
                                  activeTrack.credits.arranger ? `편곡: ${activeTrack.credits.arranger}` : null,
                                  activeTrack.credits.producer ? `프로듀서: ${activeTrack.credits.producer}` : null,
                                  currentVersion.vocal ? `보컬: ${currentVersion.vocal}` : null
                                ].filter(Boolean).join(' • ')?.normalize('NFC') || ''}
                             </span>
                          )}
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0 pl-3 md:pl-5 border-l border-slate-200 ml-2">
               <button 
                 onClick={(e) => { e.stopPropagation(); if (hasPrevTrack) playPrevTrack(); }} 
                 disabled={!hasPrevTrack}
                 className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                   hasPrevTrack 
                     ? 'bg-slate-50 text-slate-500 hover:bg-[#C48C5E] hover:text-white cursor-pointer' 
                     : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                 }`}
               >
                 <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
               </button>
               <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(196,140,94,0.4)]">
                 {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); if (hasNextTrack) playNextTrack(); }} 
                 disabled={!hasNextTrack}
                 className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                   hasNextTrack 
                     ? 'bg-slate-50 text-slate-500 hover:bg-[#C48C5E] hover:text-white cursor-pointer' 
                     : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                 }`}
               >
                 <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
               </button>
               <div className="w-px h-6 bg-slate-200 mx-1"></div>
               <button onClick={(e) => { e.stopPropagation(); stopPlayback(); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
         </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
        
        .font-handwriting {
          font-family: 'Nanum Pen Script', cursive;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-image-y {
          -webkit-mask-image: linear-gradient(to bottom, transparent, white 10%, white 90%, transparent);
          mask-image: linear-gradient(to bottom, transparent, white 10%, white 90%, transparent);
        }
        .mask-image-x {
          -webkit-mask-image: linear-gradient(to right, transparent, white 2%, white 98%, transparent);
          mask-image: linear-gradient(to right, transparent, white 2%, white 98%, transparent);
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
          will-change: transform;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </>
  );
}
