"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Music, FileText, List, ArrowRight, PlayCircle, Heart, Download, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [latestSheets, setLatestSheets] = useState<any[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [latestMusic, setLatestMusic] = useState<any[]>([]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    const fetchLatestContent = async () => {
      try {
        // 1. Fetch latest 6 premium/free sheets
        const qSheets = query(collection(db, 'sheets'), orderBy('createdAt', 'desc'), limit(6));
        const snapSheets = await getDocs(qSheets);
        
        setLatestSheets(snapSheets.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert timestamp to string or date object as needed for display
            releaseDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        }));

        // 2. Fetch latest 2 blogs
        const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(2));
        const snapBlogs = await getDocs(qBlogs);
        setLatestBlogs(snapBlogs.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // 3. Fetch latest 4 music albums
        const qMusic = query(collection(db, 'music'), orderBy('createdAt', 'desc'), limit(4));
        const snapMusic = await getDocs(qMusic);
        setLatestMusic(snapMusic.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching latest content', error);
      }
    };
    fetchLatestContent();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="pt-24 min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        {/* Band Image Container */}
        <div className="-mt-10 md:-mt-16 mb-8 md:mb-12 w-full max-w-[320px] md:max-w-[480px] lg:max-w-[600px] h-auto relative z-10 mx-auto opacity-90 transform transition-transform hover:scale-105 duration-500">
          <Image 
            src="/hero-band.png" 
            alt="ibiGband outline art" 
            width={600} 
            height={400} 
            className="w-full h-auto object-contain mix-blend-multiply" 
          />
        </div>
        <h1 className="text-[46px] sm:text-[60px] md:text-[88px] font-handwriting mb-2 md:mb-6 leading-[1.05] text-[#2D2926] relative z-10 tracking-[-0.06em] break-keep">
          찬양이 멈추지 않는 <br />
          <span className="text-[#E6C79C] tracking-[-0.08em]">아카이브</span>
        </h1>
        <p className="text-[#78716A] text-[14px] sm:text-[15px] md:text-lg max-w-xl mx-auto mb-10 font-light leading-relaxed relative z-10 break-keep px-4 sm:px-0 tracking-tight">
          고퀄리티 프리미엄 악보와 영감을 주는 아티스트 저널을 만나보세요. <br className="hidden sm:block"/>
          어디서든 모바일 앱처럼 가장 빠르게 접속할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-4 justify-center relative z-10">
          <button onClick={() => router.push('/sheets')} className="bg-[#2D2926] text-white px-10 py-5 rounded-ibig shadow-2xl flex items-center gap-3 transform hover:-translate-y-1 hover:shadow-3xl transition-all font-bold">
            <FileText size={20}/> 악보 라이브러리 입장
          </button>
          <button onClick={() => router.push('/setlist')} className="bg-white border-2 border-[#78716A]/10 text-[#78716A] px-10 py-5 rounded-ibig flex items-center gap-3 hover:bg-[#78716A]/5 transition-all font-bold">
            <List size={20}/> 스마트 셋리스트
          </button>
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="pt-24 px-6 max-w-7xl mx-auto border-t border-[#78716A]/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-handwriting mb-2 text-[#2D2926]">새로운 음반</h2>
            <p className="text-sm text-[#78716A]">가장 최근에 발매된 음반들을 들어보세요</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link href="/music" className="px-5 py-3 bg-[#2D2926] text-white rounded-full hover:bg-[#E6C79C] hover:text-[#2D2926] flex items-center justify-center font-bold text-sm transition-all">전체 듣기</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {latestMusic.map((album) => (
              <div 
                key={album.id} 
                className="group flex flex-col transition-transform duration-300 hover:-translate-y-2 cursor-pointer"
                onClick={() => router.push(`/music?albumId=${album.id}`)}
              >
                <div className="w-full aspect-square rounded-[24px] overflow-hidden mb-4 relative shadow-md border border-[#2D2926]/15 bg-white">
                  {album.coverUrl ? (
                    <Image 
                      src={album.coverUrl} 
                      alt={album.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-[#78716A]/50">
                       <Music size={40} className="mb-2" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center backdrop-blur-sm">
                    <div className="w-14 h-14 rounded-full bg-white text-[#C48C5E] flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-md">
                      <PlayCircle className="w-8 h-8 fill-current text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                     <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[#2D2926] shadow-sm">
                        {album.type || 'Album'}
                     </span>
                  </div>
                  {album.type === 'Single' && (
                     <div className="absolute bottom-3 left-3 right-3 flex justify-start">
                        <span className="bg-black/40 backdrop-blur-md text-white/80 text-[10px] md:text-xs font-medium px-2 py-1 rounded max-w-full truncate shadow-sm">
                           {album.title}
                        </span>
                     </div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-[#2D2926] leading-tight mb-1 group-hover:text-[#E6C79C] transition-colors line-clamp-1">
                   {album.type === 'Single' && album.tracks?.[0] ? ((album.tracks[0].versions || []).find((v: {lang: string, title: string}) => v.lang === 'ko')?.title || album.tracks[0].title) : album.title}
                </h3>
                <p className="font-handwriting text-[#78716A] text-[17px] mb-4 flex-1 line-clamp-2">{album.description}</p>
                <button 
                  className="mt-auto self-start bg-[#FAF9F6] hover:bg-[#E6C79C]/20 border border-[#78716A]/10 text-[#2D2926] text-xs font-bold uppercase px-4 py-2 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                  onClick={(e) => {
                     e.stopPropagation();
                     router.push(`/music?albumId=${album.id}`);
                  }}
                >
                  음반 들어보기 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {latestMusic.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#78716A]">아직 등록된 음반이 없습니다</div>
            )}
        </div>
      </section>

      {/* Featured Sheet Music Section */}
      <section className="pt-24 px-6 max-w-7xl mx-auto mb-20 border-t border-[#78716A]/10 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-handwriting mb-2 text-[#2D2926]">악보 라이브러리</h2>
            <p className="text-sm text-[#78716A]">최신 등록된 고해상도 악보와 음원자료</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Link href="/sheets" className="p-4 bg-white border border-[#78716A]/10 rounded-full hover:bg-[#78716A]/5 flex items-center justify-center transition-all"><ArrowRight size={20} className="text-[#78716A]"/></Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestSheets.map((sheet) => (
              <div key={sheet.id} className="bg-white p-8 rounded-ibig shadow-sm border border-[#78716A]/5 group hover:shadow-xl transition-all relative overflow-hidden flex flex-col cursor-pointer" onClick={() => router.push(`/sheets?id=${sheet.id}`)}>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Music size={80} className="text-[#E6C79C]" />
                </div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  {sheet.isPremiumOnly ? (
                     <div className="px-3 py-1 bg-[#E6C79C]/20 rounded-full text-[10px] font-bold text-[#2D2926] tracking-wider">PREMIUM</div>
                  ) : (
                     <div className="px-3 py-1 bg-[#2D2926]/10 rounded-full text-[10px] font-bold text-[#2D2926] tracking-wider">FREE</div>
                  )}
                  {sheet.youtubeId ? (
                     <PlayCircle size={18} className="text-[#E6C79C]" />
                  ) : (
                     <Heart size={18} className="text-[#78716A] hover:text-red-400" />
                  )}
                </div>
                <h4 className="text-2xl font-handwriting mb-2 text-[#2D2926] line-clamp-1 truncate relative z-10">{sheet.title}</h4>
                <p className="text-xs text-[#78716A] mb-8 font-light italic truncate relative z-10">{sheet.artist || 'ibiGband'} | {sheet.key ? `${sheet.key} Key` : 'N/A'} | {sheet.bpm ? `${sheet.bpm} BPM` : 'N/A'}</p>
                <div className="flex gap-3 mt-auto relative z-10">
                  <button className="flex-1 py-4 bg-[#2D2926] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#78716A] transition-all shadow-md"><Download size={14}/> 자세히 보기</button>
                  <button className="w-14 h-14 shrink-0 bg-[#FAF9F6] rounded-2xl flex items-center justify-center hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]"><ArrowRight size={20}/></button>
                </div>
              </div>
            ))}
            {latestSheets.length === 0 && (
              <div className="col-span-3 text-center py-20 text-[#78716A]">아직 등록된 악보가 없습니다</div>
            )}
        </div>
      </section>

      {/* Featured Blog Section */}
      <section className="pt-32 px-6 max-w-5xl mx-auto pb-12 md:pb-24">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-6xl font-handwriting text-[#2D2926]">묵상과 예술</h2>
          <p className="text-[#78716A] italic font-light">&quot;찬양은 삶의 고백이자 예술의 완성입니다.&quot;</p>
          <div className="w-20 h-1 bg-[#E6C79C] mx-auto rounded-full mt-8"></div>
        </div>
        <div className="space-y-32">
          {latestBlogs.map((blog) => (
            <article key={blog.id} className="group relative">
              <div className="aspect-[21/10] rounded-ibig overflow-hidden mb-10 shadow-2xl bg-[#2D2926] relative cursor-pointer" onClick={() => router.push(`/blog/${blog.id}`)}>
                {blog.imageUrl ? (
                    <Image src={blog.imageUrl} alt={blog.title} fill className="object-cover group-hover:scale-110 transition-transform duration-[2s]" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/40"><BookOpen size={48} className="text-white/20"/></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-6 md:left-10 text-white right-6">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2 block text-[#E6C79C]">{blog.category || 'Artist Note'}</span>
                  <h3 className="text-3xl md:text-5xl font-handwriting line-clamp-2 leading-tight">{blog.title}</h3>
                </div>
              </div>
              <div className="max-w-3xl mx-auto text-center md:text-left">
                <p className="text-lg text-[#78716A] leading-relaxed font-light mb-8 line-clamp-3">
                   {blog.excerpt || blog.content.replace(/<[^>]+>/g, '')}
                </p>
                <button onClick={() => router.push(`/blog/${blog.id}`)} className="px-8 py-3 bg-transparent border border-[#2D2926] text-[#2D2926] rounded-full text-sm font-bold hover:bg-[#2D2926] hover:text-white transition-all">더 읽어보기</button>
              </div>
            </article>
          ))}
          {latestBlogs.length === 0 && (
             <div className="text-center py-20 text-[#78716A]">아직 작성된 저널이 없습니다</div>
          )}
        </div>
      </section>
    </div>
  );
}
