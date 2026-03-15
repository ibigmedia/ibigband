"use client";

import React, { useState, useEffect } from 'react';
import { Play, Globe2, ChevronRight, Music } from 'lucide-react';
import Image from 'next/image';

import { MusicAlbum } from '@/types/music';
import { useMusicStore } from '@/store/useMusicStore';

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

type ViewTab = 'overview' | 'Album' | 'EP' | 'Single' | 'global';

export default function MusicPage() {
  const { albums, selectedAlbum, openAlbumModal } = useMusicStore();

  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [globalLangFilter, setGlobalLangFilter] = useState<'All' | 'en' | 'es'>('All');

  // Handle auto-opening album from URL
  useEffect(() => {
    if (albums.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const albumId = params.get('albumId');
      if (albumId && !selectedAlbum) {
        const targetAlbum = albums.find(a => a.id === albumId);
        if (targetAlbum) {
          openAlbumModal(targetAlbum);
          // Optional: clear the URL so it doesn't re-trigger on refresh
          window.history.replaceState({}, '', '/music');
        }
      }
    }
  }, [albums, selectedAlbum, openAlbumModal]);

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
        {album.type === 'Single' && (
            <div className="absolute bottom-3 left-3 right-3 flex justify-start">
               <span className="bg-black/40 backdrop-blur-md text-white/80 text-[10px] md:text-xs font-medium px-2 py-1 rounded max-w-full truncate shadow-sm">
                  {album.title}
               </span>
            </div>
         )}
      </div>
      <h3 className="font-bold text-base md:text-lg text-slate-900 leading-tight mb-1 shrink-0 group-hover:text-[#C48C5E] transition-colors line-clamp-1">
         {album.type === 'Single' && album.tracks?.[0] ? ((album.tracks[0].versions || []).find((v: {lang: string, title: string}) => v.lang === 'ko')?.title || album.tracks[0].title) : album.title}
      </h3>
      
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
                   <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'Album').slice(0, 7).map(a => renderAlbumCard(a))}
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
                   <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'EP').slice(0, 7).map(a => renderAlbumCard(a))}
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
                   <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-6">
                      {albums.filter(a => a.type === 'Single').slice(0, 7).map(a => renderAlbumCard(a))}
                   </div>
                </section>
             )}
          </div>
        )}

        {/* ALBUMS / EP / SINGLES SPECIFIC VIEWS */}
        {['Album', 'EP', 'Single'].includes(activeTab) && (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5 md:gap-8 gap-y-10 animate-in fade-in duration-500">
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

             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5 md:gap-8 gap-y-10">
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
    </div>
  );
}
