'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Play, Pause, X, Globe2, ChevronRight, Users, Mic2, Disc, Languages } from 'lucide-react';
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
          className="fixed inset-0 z-[100] flex items-center justify-center pt-16 pb-0 md:p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeAlbumModal}
        >
          <div 
            className="w-full h-full max-w-[1280px] bg-white md:rounded-[40px] relative overflow-hidden flex flex-col md:flex-row shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-500 transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Close Modal Button */}
             <button 
               onClick={closeAlbumModal}
               className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-100 text-slate-800 rounded-full flex justify-center items-center transition-all duration-300"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Modal Left Pane */}
             <div className="md:w-5/12 lg:w-4/12 flex flex-col h-[30%] md:h-full bg-[#FDFCFB] border-r border-slate-100 relative shrink-0">
               <div className="relative z-10 flex flex-col h-full overflow-y-auto hide-scrollbar p-3 md:p-6 lg:p-8">
                  <div className="flex md:flex-col items-center md:items-start gap-4 mb-4 md:mt-2">
                     <div className="w-16 h-16 md:w-full md:max-w-[160px] aspect-square rounded-[16px] md:rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)] relative shrink-0">
                        <Image src={selectedAlbum.coverUrl} alt={selectedAlbum.title} fill className="object-cover" sizes="(max-width: 768px) 64px, 160px" />
                     </div>
                     <div className="flex-1 mt-1">
                        <span className="text-[#C48C5E] text-[10px] font-bold uppercase tracking-widest block mb-1 border border-[#C48C5E]/30 bg-[#C48C5E]/5 px-2 py-0.5 rounded-full w-max">
                           {selectedAlbum.type}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-handwriting text-slate-900 leading-tight mb-1">{selectedAlbum.title}</h2>
                        <p className="text-slate-500 text-[11px] md:text-xs leading-snug hidden md:block line-clamp-3">{selectedAlbum.description}</p>
                     </div>
                  </div>

                  {/* Tracklist */}
                  <div className="mb-6 flex-1">
                     <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Tracklist</h3>
                     <div className="flex flex-col gap-1">
                        {selectedAlbum.tracks.map((track, i) => {
                          const isActive = activeTrack.id === track.id;
                          return (
                            <div 
                              key={track.id} 
                              onClick={() => handleTrackSelect(track)}
                              className={`flex items-center gap-2 md:gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                                isActive 
                                  ? 'bg-[#C48C5E] text-white shadow-sm' 
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                              }`}
                            >
                               <div className={`w-5 text-center font-bold text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                 {isActive && isPlaying ? <Play className="w-3 h-3 mx-auto fill-current animate-pulse"/> : `${i+1}`}
                               </div>
                               <div className="flex-1">
                                  <p className={`font-handwriting font-normal text-[17px] md:text-xl leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>{track.title?.normalize('NFC') || track.title}</p>
                                  {track.versions.length > 1 && !isActive && (
                                     <p className="text-[9px] text-slate-400 md:font-medium mt-0.5">{track.versions.length} versions</p>
                                  )}
                               </div>
                               <div className={`text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{track.duration}</div>
                            </div>
                          )
                        })}
                     </div>
                  </div>

                  {/* Credits Block */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mt-auto shrink-0">
                     <div className="flex items-center gap-1.5 mb-3 text-[#C48C5E]">
                        <Users className="w-3.5 h-3.5 md:w-4 md:h-4"/>
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest">Credits</h3>
                     </div>
                     <div className="flex flex-col gap-2">
                        {activeTrack.credits.composer && (
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Words & Music</span>
                              <span className="text-slate-800 text-xs md:text-sm font-semibold">{activeTrack.credits.composer}</span>
                           </div>
                        )}
                        {currentVersion.vocal && (
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1"><Mic2 className="w-3 h-3"/> Vocals ({langNames[activeLanguage(activeTrack, activeLang)]})</span>
                              <span className="text-slate-800 text-xs md:text-sm font-semibold">{currentVersion.vocal}</span>
                           </div>
                        )}
                        {activeTrack.credits.arranger && (
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Arrangement</span>
                              <span className="text-slate-800 text-xs md:text-sm font-semibold">{activeTrack.credits.arranger}</span>
                           </div>
                        )}
                        {activeTrack.credits.producer && (
                           <div className="flex flex-col gap-1 mt-2">
                              <span className="text-[10px] text-[#C48C5E] uppercase font-bold tracking-widest flex items-center gap-1"><Disc className="w-3 h-3"/> Executive Producer</span>
                              <span className="text-[#C48C5E] text-xs md:text-sm font-bold">{activeTrack.credits.producer}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             </div>

             {/* Modal Right Pane */}
             <div className="md:w-7/12 lg:w-8/12 flex flex-col h-[70%] md:h-full relative overflow-hidden bg-white shadow-xl md:shadow-none z-10 rounded-t-[24px] md:rounded-t-none md:rounded-r-[40px] transition-transform duration-500">
               <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
                  <Image src={selectedAlbum.coverUrl} alt="bg" fill className="object-cover blur-[60px]" />
               </div>
               
               <div className="relative z-20 px-4 md:px-8 py-3 md:py-5 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 pr-12 md:pr-0">
                     <span className="text-[#C48C5E] font-bold tracking-widest text-[9px] uppercase block mb-0.5">Now Playing</span>
                     <h2 className="text-slate-900 text-3xl md:text-4xl line-clamp-1 leading-tight truncate font-handwriting font-normal">{currentVersion.title.normalize('NFC')}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                     {activeTrack.versions.length > 1 && (
                       <div className="flex bg-slate-100 p-1.5 rounded-full relative min-w-max shadow-inner">
                         <div className="absolute inset-y-1.5 bg-white rounded-full shadow-sm transition-all duration-300" style={{
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
                             className={`relative z-10 px-4 py-1.5 md:py-2 flex items-center gap-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${
                               activeLang === ver.lang ? 'text-[#C48C5E]' : 'text-slate-500 hover:text-slate-800'
                             }`}
                           >
                              {activeLang === ver.lang && <Languages className="w-3.5 h-3.5"/>}
                              {langNames[ver.lang]}
                           </button>
                         ))}
                       </div>
                     )}
                     
                     <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-100 ml-1">
                        <button onClick={() => setLyricsScale(Math.max(0.6, lyricsScale - 0.2))} className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-colors">A-</button>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <button onClick={() => setLyricsScale(Math.min(2.0, lyricsScale + 0.2))} className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-colors">A+</button>
                     </div>

                     <button 
                       onClick={togglePlay}
                       className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(196,140,94,0.4)] shrink-0"
                     >
                       {isPlaying ? <Pause className="w-5 h-5 md:w-7 md:h-7 fill-current" /> : <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-1" />}
                     </button>
                  </div>
               </div>
               
               <div className="relative z-20 w-full h-[3px] bg-slate-100">
                  <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full shadow-sm" style={{ width: `${progress}%` }}></div>
               </div>

               <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-4 md:p-8 lg:p-12 pb-24 pt-6 mask-image-y">
                  <div 
                    className="text-slate-800 font-handwriting font-normal tracking-tighter antialiased transition-all duration-300 transform-gpu"
                    style={{ 
                       fontSize: `calc(${1.2 * lyricsScale}rem + 0.8vw)`, 
                       lineHeight: 1.15,
                       letterSpacing: '-0.02em'
                    }}
                  >
                    {renderLyrics(currentVersion.lyrics)}
                  </div>
               </div>
             </div>
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
                            <h4 className="font-handwriting text-2xl md:text-3xl font-bold text-slate-800 leading-none group-hover:text-[#C48C5E] transition-colors">{currentVersion.title}</h4>
                            <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C48C5E] font-bold">앨범 보기 〉</span>
                          </div>
                          {activeTrackAlbum.description && (
                             <span className="text-slate-600 text-[20px] md:text-[24px] font-handwriting leading-none shrink-0 tracking-wide mt-1">
                                {activeTrackAlbum.description}
                             </span>
                          )}
                          {(activeTrack.credits.composer || activeTrack.credits.arranger || activeTrack.credits.producer || currentVersion.vocal) && (
                             <span className="text-slate-500 text-[22px] md:text-[26px] font-handwriting leading-none shrink-0 tracking-wide mt-1">
                                {[
                                  activeTrack.credits.composer ? `작곡: ${activeTrack.credits.composer}` : null,
                                  activeTrack.credits.arranger ? `편곡: ${activeTrack.credits.arranger}` : null,
                                  activeTrack.credits.producer ? `프로듀서: ${activeTrack.credits.producer}` : null,
                                  currentVersion.vocal ? `보컬: ${currentVersion.vocal}` : null
                                ].filter(Boolean).join(' • ')}
                             </span>
                          )}
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0 pl-3 md:pl-5 border-l border-slate-200 ml-2">
               <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(196,140,94,0.4)]">
                 {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
               </button>
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
        @media (max-width: 768px) {
          .animate-marquee {
            animation: marquee 12s linear infinite;
          }
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </>
  );
}
