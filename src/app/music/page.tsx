"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Disc, Users, Mic2, Languages, X, Globe2, ChevronRight, Music } from 'lucide-react';
import Image from 'next/image';

import { MusicAlbum, Track } from '@/types/music';
import { getCollectionDocs } from '@/lib/firebase/firestore';

const MOCK_ALBUMS: MusicAlbum[] = [
  {
    id: "al-1",
    type: "Single",
    title: "Amazing Grace (Global Project)",
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=800",
    releaseDate: "2024.03.15",
    description: "아이빅밴드만의 폭발적인 밴드 사운드로 재해석한 찬송가 명곡. 모두가 아는 멜로디에 새로운 호흡을 담아 선교를 위해 한국어, 영어, 스페인어 3개국어 버전으로 제작되었습니다.",
    tracks: [
      {
        id: "tr-1",
        title: "Amazing Grace (iBigBand Ver.)",
        duration: "6:12",
        credits: {
          composer: "John Newton",
          arranger: "이정만",
          instruments: "E.G: 백현, Bass: 김철, Drums: 이시온, Key: 유지민",
          producer: "박성호"
        },
        versions: [
          {
            lang: 'ko',
            title: "나 같은 죄인 살리신",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            vocal: "서유란",
            lyrics: `나 같은 죄인 살리신 주 은혜 놀라워\n잃었던 생명 찾았고 광명을 얻었네\n\n큰 죄악에서 건지신 주 은혜 고마워\n나 처음 믿은 그 시간 귀하고 귀하다\n\n(Guitar Solo)\n\n이제껏 내가 산 것도 주님의 은혜라\n또 나를 장차 본향에 인도해 주시리\n\n거기서 우리 영원히 주님의 은혜로\n해처럼 밝게 살면서 주 찬양 하리라`
          },
          {
            lang: 'en',
            title: "Amazing Grace",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            vocal: "John Doe",
            lyrics: `Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\n'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.\n\n(Guitar Solo)\n\nThrough many dangers, toils, and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.\n\nWhen we've been there ten thousand years,\nBright shining as the sun,\nWe've no less days to sing God's praise\nThan when we'd first begun.`
          },
          {
            lang: 'es',
            title: "Sublime Gracia",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            vocal: "Maria Garcia",
            lyrics: `Sublime gracia del Señor,\nQue a un infeliz salvó.\nFui ciego mas hoy miro yo,\nPerdido y Él me halló.\n\nSu gracia me enseñó a temer,\nMis dudas ahuyentó.\n¡Oh, cuán precioso fue a mi ser\nAl dar mi corazón!\n\n(Solo de Guitarra)\n\nEn los peligros o aflicción\nQue yo he tenido aquí,\nSu gracia siempre me libró\nY me guiará feliz.\n\nY cuando en Sion por siglos mil\nBrillando esté cual sol,\nYo cantaré por siempre allí\nSu amor que me salvó.`
          }
        ]
      }
    ]
  },
  {
    id: "ep-1",
    type: "EP",
    title: "우리들의 찬양 (Live in Daejeon)",
    coverUrl: "https://images.unsplash.com/photo-1598387993441-a364f854b3e1?auto=format&fit=crop&q=80&w=800",
    releaseDate: "2023.11.20",
    description: "2023년 대전 라이브 워십 생방송의 현장을 담은 감동의 라이브 실황 EP 앨범.",
    tracks: [
      {
        id: "tr-2",
        title: "은혜로다 (Live)",
        duration: "5:30",
        credits: {
          composer: "전은주",
          arranger: "아이빅밴드",
          instruments: "A.G: 이정만, Piano: 유지민, Bass: 김철, Drum: 이시온",
        },
        versions: [
          {
            lang: 'ko',
            title: "은혜로다 (Live)",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            vocal: "이정만",
            lyrics: `시작됐네 우리 주님의 능력이\n나의 삶을 다스리고 새롭게 하네\n자유하네 죄와 사망의 법에서\n나의 삶에 참 평가와 기쁨이 넘치네\n\n은혜로다 주의 은혜\n한량 없는 주의 은혜\n은혜로다 주의 은혜\n변함 없는 신실하신 주의 은혜\n\n나의 평생에 찬양하며 살리\n주의 십자가 사랑\n나를 구원하신 그 은혜를`
          }
        ]
      }
    ]
  },
  {
    id: "al-2",
    type: "Album",
    title: "The First Album: IBIG BAND",
    coverUrl: "https://images.unsplash.com/photo-1621618451859-42b78490a1ca?auto=format&fit=crop&q=80&w=800",
    releaseDate: "2022.05.10",
    description: "아이빅밴드의 첫 번째 정규 앨범. 다양한 장르로 해석된 은혜로운 찬송과 CCM 대작업",
    tracks: [
      {
        id: "tr-4",
        title: "주님 다시 오실 때까지",
        duration: "5:05",
        credits: {
          composer: "고형원",
          arranger: "아이빅밴드",
          instruments: "All Sessions",
          producer: "박성호"
        },
        versions: [
          {
            lang: 'ko',
            title: "주님 다시 오실 때까지",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            vocal: "아이빅밴드 합창",
            lyrics: `주님 다시 오실 때까지\n나는 이 길을 가리라\n좁은 문 좁은 길\n나의 십자가 지고\n\n나의 가는 이 길 끝에서\n나는 주님을 보리라\n영광의 내 주님\n나를 맞아주시리\n\n주님 다시 오실 때까지\n나는 일어나 찬양하리라\n내 이름 아시는 주님\n기다리며 나 살리라`
          }
        ]
      }
    ]
  }
];

const langNames = {
  ko: '한국어',
  en: 'English',
  es: 'Español'
};

type ViewTab = 'overview' | 'Album' | 'EP' | 'Single' | 'global';

export default function MusicPage() {
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);

  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [globalLangFilter, setGlobalLangFilter] = useState<'All' | 'en' | 'es'>('All');
  
  // Modal State
  const [selectedAlbum, setSelectedAlbum] = useState<MusicAlbum | null>(null);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [activeLang, setActiveLang] = useState<'ko' | 'en' | 'es'>('ko');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Custom lyrics font scale
  const [lyricsScale, setLyricsScale] = useState(0.8);

  // Fetch data from Firebase
  useEffect(() => {
    async function fetchAlbums() {
      try {
        const data = await getCollectionDocs<MusicAlbum>('music', []);
        // Sort by releaseDate falling back to createdAt or reverse order
        data.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
        setAlbums(data.length > 0 ? data : MOCK_ALBUMS);
      } catch (e) {
        console.error("Failed to fetch music albums:", e);
        setAlbums(MOCK_ALBUMS);
      }
    }
    fetchAlbums();
  }, []);

  // Focus lock for modal
  useEffect(() => {
    if (selectedAlbum) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [selectedAlbum]);

  let currentVersion = activeTrack?.versions.find(v => v.lang === activeLang);
  if (!currentVersion && activeTrack) {
    currentVersion = activeTrack.versions[0];
  }

  useEffect(() => {
    if (audioRef.current && currentVersion) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      }
    }
  }, [currentVersion, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
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

  const openAlbumModal = (album: MusicAlbum, defaultLang?: 'ko'|'en'|'es') => {
    setSelectedAlbum(album);
    setActiveTrack(album.tracks[0]);
    // If opening from global section, try to default to the selected language context
    let selectedLang = defaultLang || album.tracks[0].versions[0].lang;
    if (!album.tracks[0].versions.some(v => v.lang === selectedLang)) {
       selectedLang = album.tracks[0].versions[0].lang;
    }
    setActiveLang(selectedLang);
    setProgress(0);
    setIsPlaying(false);
  };

  const closeAlbumModal = () => {
    setSelectedAlbum(null);
    // Does not clear activeTrack or pause audio, allowing mini-player to show
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setProgress(0);
    setActiveTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Find the album for the active track to reopen modal from mini-player
  const activeTrackAlbum = activeTrack ? albums.find(a => a.tracks.some(t => t.id === activeTrack.id)) : null;

  const handleTrackSelect = (track: Track) => {
    if (activeTrack?.id === track.id) {
       togglePlay();
       return;
    }
    setActiveTrack(track);
    // Try to keep the same language if the new track supports it
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
  
  // Data Filtering Helpers
  const getGlobalAlbums = () => {
     return albums.filter(album => 
        album.tracks.some(track => 
           track.versions.some(v => 
              (globalLangFilter === 'All' && v.lang !== 'ko') || v.lang === globalLangFilter
           )
        )
     );
  };

  const renderAlbumCard = (album: MusicAlbum, defaultLang?: 'ko'|'en'|'es') => (
    <div 
      key={album.id} 
      className="group flex flex-col transition-transform duration-300 hover:-translate-y-2 h-full"
    >
      <div 
        onClick={() => openAlbumModal(album, defaultLang)}
        className="cursor-pointer w-full aspect-square rounded-[24px] overflow-hidden mb-4 relative shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white border border-slate-100"
      >
        <Image 
          src={album.coverUrl} 
          alt={album.title} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-110" 
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw" 
        />
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center backdrop-blur-sm">
           <div className="w-14 h-14 rounded-full bg-white/90 text-[#C48C5E] flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 delay-100 shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
              <Play className="w-6 h-6 fill-current ml-1" />
           </div>
        </div>
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
           <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-slate-800 shadow-sm">
              {album.type}
           </span>
           {album.tracks.some(t => t.versions.length > 1) && (
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-[#C48C5E]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-white shadow-sm flex items-center gap-1">
                 <Globe2 className="w-3 h-3" /> Global
              </span>
           )}
        </div>
      </div>
      <h3 className="font-bold text-base md:text-lg text-slate-900 leading-tight mb-1 shrink-0 group-hover:text-[#C48C5E] transition-colors line-clamp-1">{album.title}</h3>
      <p className="text-slate-400 text-xs md:text-sm font-medium mb-3 shrink-0">{album.releaseDate}</p>
      
      <p className="font-handwriting text-slate-600 text-[17px] md:text-[19px] leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 flex-1">
        {album.description}
      </p>

      <button 
        onClick={() => openAlbumModal(album, defaultLang)}
        className="mt-auto self-start bg-slate-50 hover:bg-[#C48C5E] hover:text-white text-slate-600 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
      >
        자세히 보기 <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 font-sans">
      
      <audio 
         ref={audioRef} 
         onTimeUpdate={handleTimeUpdate}
         onEnded={() => setIsPlaying(false)}
      >
        {currentVersion && <source src={currentVersion.audioUrl} />}
      </audio>

      {/* MAIN LAYOUT */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-32 pt-28 md:pt-40 flex flex-col gap-12 lg:gap-16">
        
        {/* Header & Tabs */}
        <header className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 font-serif">
              Music<span className="text-[#C48C5E]">.</span>
            </h1>
            <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium">
               아이빅밴드가 전하는 따뜻하고 서정적인 메시지. 찾고 계시는 음반 종류나 글로벌 버전의 찬양을 쉽고 편하게 감상할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 snap-x border-b border-slate-200">
            {([
               { id: 'overview', label: 'Overview' },
               { id: 'Album', label: '정규 앨범' },
               { id: 'EP', label: 'EP' },
               { id: 'Single', label: '싱글' },
               { id: 'global', label: '글로벌 찬양 (EN/ES)' },
            ] as const).map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ViewTab)}
                className={`snap-start shrink-0 px-5 py-3 font-bold text-sm md:text-base border-b-2 transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id 
                  ? 'border-[#C48C5E] text-[#C48C5E]' 
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* --- DYNAMIC VIEWS BASED ON TAB --- */}
        
        {/* OVERVIEW VIEW */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-16">
             {/* Section: Albums */}
             {albums.some(a => a.type === 'Album') && (
                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">정규 앨범 <span className="text-slate-300 font-sans ml-2 block sm:inline text-lg font-medium">Albums</span></h2>
                      <button onClick={() => setActiveTab('Album')} className="text-[#C48C5E] text-sm font-bold flex items-center hover:underline">
                         더보기 <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'Album').slice(0, 5).map(a => renderAlbumCard(a))}
                   </div>
                </section>
             )}

             {/* Section: EPs */}
             {albums.some(a => a.type === 'EP') && (
                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">EP <span className="text-slate-300 font-sans ml-2 block sm:inline text-lg font-medium">Extended Plays</span></h2>
                      <button onClick={() => setActiveTab('EP')} className="text-[#C48C5E] text-sm font-bold flex items-center hover:underline">
                         더보기 <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'EP').slice(0, 5).map(a => renderAlbumCard(a))}
                   </div>
                </section>
             )}

             {/* Section: Singles */}
             {albums.some(a => a.type === 'Single') && (
                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">싱글 <span className="text-slate-300 font-sans ml-2 block sm:inline text-lg font-medium">Singles</span></h2>
                      <button onClick={() => setActiveTab('Single')} className="text-[#C48C5E] text-sm font-bold flex items-center hover:underline">
                         더보기 <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'Single').slice(0, 5).map(a => renderAlbumCard(a))}
                   </div>
                </section>
             )}
          </div>
        )}

        {/* ALBUMS / EP / SINGLES SPECIFIC VIEWS */}
        {['Album', 'EP', 'Single'].includes(activeTab) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-8 gap-y-10 animate-in fade-in duration-500">
             {albums.filter(a => a.type === activeTab).map(a => renderAlbumCard(a))}
             
             {albums.filter(a => a.type === activeTab).length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400">
                   <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p>현재 등록된 {activeTab} 음반이 없습니다.</p>
                </div>
             )}
          </div>
        )}

        {/* GLOBAL (MULTI-LANGUAGE) VIEW */}
        {activeTab === 'global' && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
             
             {/* Sub Filter for Global Tab */}
             <div className="flex gap-2 mb-2 border border-slate-200 bg-white p-1.5 rounded-full w-max shadow-sm">
                {(['All', 'en', 'es'] as const).map(lang => (
                   <button
                     key={lang}
                     onClick={() => setGlobalLangFilter(lang)}
                     className={`px-5 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                        globalLangFilter === lang 
                        ? 'bg-[#C48C5E] text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                     }`}
                   >
                     {lang === 'All' ? '모든 글로벌 곡' : lang === 'en' ? 'English (영어)' : 'Español (스페인어)'}
                   </button>
                ))}
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-8 gap-y-10">
                {getGlobalAlbums().map(album => 
                   // When filtering by a specific language, clicking the card will default to that language!
                   renderAlbumCard(album, globalLangFilter === 'All' ? undefined : globalLangFilter)
                )}

                {getGlobalAlbums().length === 0 && (
                   <div className="col-span-full py-20 text-center text-slate-400">
                      <Globe2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>해당 언어 버전이 포함된 곡이 없습니다.</p>
                   </div>
                )}
             </div>
          </div>
        )}

      </main>

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

             {/* Modal Left Pane (Details & Tracks & Credits) */}
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
                                  <p className={`font-handwriting text-[17px] md:text-xl leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>{track.title}</p>
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

             {/* Modal Right Pane (Player & Lyrics) */}
             <div className="md:w-7/12 lg:w-8/12 flex flex-col h-[70%] md:h-full relative overflow-hidden bg-white shadow-xl md:shadow-none z-10 rounded-t-[24px] md:rounded-t-none md:rounded-r-[40px] transition-transform duration-500">
               
               {/* Background Cover Blur Effect - Kept very subtle and soft */}
               <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
                  <Image src={selectedAlbum.coverUrl} alt="bg" fill className="object-cover blur-[60px]" />
               </div>
               
               {/* Sticky Action Navigation (Player Controls + Tabs) */}
               <div className="relative z-20 px-4 md:px-8 py-3 md:py-5 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 pr-12 md:pr-0">
                     <span className="text-[#C48C5E] font-bold tracking-widest text-[9px] uppercase block mb-0.5">Now Playing</span>
                     <h2 className="text-slate-900 text-3xl md:text-4xl line-clamp-1 leading-tight truncate font-handwriting">{currentVersion.title}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap">
                     {/* Multi-Language Tabs */}
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
                               activeLang === ver.lang 
                               ? 'text-[#C48C5E]' 
                               : 'text-slate-500 hover:text-slate-800'
                             }`}
                           >
                              {activeLang === ver.lang && <Languages className="w-3.5 h-3.5"/>}
                              {langNames[ver.lang]}
                           </button>
                         ))}
                       </div>
                     )}
                     
                     {/* Font Size Controls */}
                     <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-100 ml-1">
                        <button onClick={() => setLyricsScale(s => Math.max(0.6, s - 0.2))} className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-colors">A-</button>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <button onClick={() => setLyricsScale(s => Math.min(2.0, s + 0.2))} className="w-7 h-7 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-full transition-colors">A+</button>
                     </div>

                     {/* Play Control */}
                     <button 
                       onClick={togglePlay}
                       className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(196,140,94,0.4)] shrink-0"
                     >
                       {isPlaying ? <Pause className="w-5 h-5 md:w-7 md:h-7 fill-current" /> : <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-1" />}
                     </button>
                  </div>
               </div>
               
               {/* Progress Bar Visual Line */}
               <div className="relative z-20 w-full h-[3px] bg-slate-100">
                  <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full shadow-sm" style={{ width: `${progress}%` }}></div>
               </div>

               {/* Scrollable Lyrics Area */}
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

      {/* MINI PLAYER (Visible when modal is closed but track is active) */}
      {!selectedAlbum && activeTrack && currentVersion && activeTrackAlbum && (
         <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 md:px-8 py-4 z-[90] flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-full duration-500">
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => openAlbumModal(activeTrackAlbum, currentVersion.lang)}>
               <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden relative shadow-sm shrink-0">
                  <Image src={activeTrackAlbum.coverUrl} alt="cover" fill className="object-cover group-hover:scale-110 transition-transform duration-300" sizes="56px" />
               </div>
               <div className="flex flex-col">
                  <h4 className="font-handwriting text-2xl md:text-3xl font-bold text-slate-800 leading-none group-hover:text-[#C48C5E] transition-colors">{currentVersion.title}</h4>
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#C48C5E] font-bold mt-1">앨범 보기 〉</span>
               </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0">
               <button onClick={togglePlay} className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(196,140,94,0.4)]">
                 {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
               </button>
               <button onClick={stopPlayback} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-800 transition-colors">
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
      `}} />
    </div>
  );
}

function activeLanguage(track: Track, lang: 'ko' | 'en' | 'es'): 'ko' | 'en' | 'es' {
   if (track.versions.some(v => v.lang === lang)) return lang;
   return track.versions[0].lang as 'ko' | 'en' | 'es';
}
