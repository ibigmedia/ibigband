"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Music, FileText, List, ArrowRight, Play, PlayCircle, Heart, Download, BookOpen, LayoutList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SheetModal from '@/components/sheets/SheetModal';
import { Sheet } from '@/types/sheet';
import { Video as VideoType } from '@/types/video';
import VideoModal from '@/components/video/VideoModal';

export default function Home() {
  const router = useRouter();
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [latestSheets, setLatestSheets] = useState<any[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [latestMusic, setLatestMusic] = useState<any[]>([]);
  const [latestVideos, setLatestVideos] = useState<VideoType[]>([]);
  const [previewVideo, setPreviewVideo] = useState<VideoType | null>(null);
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
            title: data.title ? data.title.normalize('NFC') : data.title,
            artist: data.artist ? data.artist.normalize('NFC') : data.artist,
            // Convert timestamp to string or date object as needed for display
            releaseDate: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        }));

        // 2. Fetch latest 4 blogs
        const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(4));
        const snapBlogs = await getDocs(qBlogs);
        setLatestBlogs(snapBlogs.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            title: data.title ? data.title.normalize('NFC') : data.title,
            excerpt: data.excerpt ? data.excerpt.normalize('NFC') : data.excerpt
          };
        }));

        // 3. Fetch latest 4 music albums
        const qMusic = query(collection(db, 'music'), orderBy('createdAt', 'desc'), limit(4));
        const snapMusic = await getDocs(qMusic);
        setLatestMusic(snapMusic.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            title: data.title ? data.title.normalize('NFC') : data.title,
            description: data.description ? data.description.normalize('NFC') : data.description
          };
        }));

        // 4. Fetch latest 3 featured/latest videos
        const qVideos = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(3));
        const snapVideos = await getDocs(qVideos);
        setLatestVideos(snapVideos.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType)));
      } catch (error) {
        console.error('Error fetching latest content', error);
      }
    };
    fetchLatestContent();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="pt-16 md:pt-24 min-h-[50vh] md:min-h-[80vh] flex flex-col items-center justify-center text-center px-4 md:px-6">
        {/* Band Image Container */}
        <div className="-mt-6 md:-mt-16 mb-6 md:mb-12 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[480px] lg:max-w-[600px] h-auto relative z-10 mx-auto opacity-90 transform transition-transform hover:scale-105 duration-500">
          <Image 
            src="/hero-band.png" 
            alt="ibiGband outline art" 
            width={600} 
            height={400} 
            className="w-full h-auto object-contain mix-blend-multiply" 
          />
        </div>
        <h1 className="text-[38px] sm:text-[60px] md:text-[88px] font-handwriting mb-2 md:mb-6 leading-[1.1] md:leading-[1.05] text-[#2D2926] relative z-10 tracking-[-0.06em] break-keep">
          찬양이 멈추지 않는 <br />
          <span className="text-[#E6C79C] tracking-[-0.08em]">아카이브</span>
        </h1>
        <p className="text-[#78716A] text-[13px] sm:text-[15px] md:text-lg max-w-xl mx-auto mb-8 md:mb-10 font-light leading-relaxed relative z-10 break-keep px-2 sm:px-0 tracking-tight">
          고퀄리티 프리미엄 악보와 영감을 주는 아티스트 저널을 만나보세요. <br className="hidden sm:block"/>
          어디서든 모바일 앱처럼 가장 빠르게 접속할 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center relative z-10 w-full px-4 md:px-0 max-w-sm sm:max-w-none mx-auto">
          <button onClick={() => router.push('/sheets')} className="bg-[#2D2926] text-white px-6 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-ibig shadow-2xl flex items-center justify-center gap-3 transform hover:-translate-y-1 hover:shadow-3xl transition-all font-bold text-sm md:text-base w-full sm:w-auto">
            <FileText size={18}/> 악보 라이브러리 입장
          </button>
          <button onClick={() => router.push('/setlist')} className="bg-white border-2 border-[#78716A]/10 text-[#78716A] px-6 py-4 md:px-10 md:py-5 rounded-2xl md:rounded-ibig flex items-center justify-center gap-3 hover:bg-[#78716A]/5 transition-all font-bold text-sm md:text-base w-full sm:w-auto">
            <List size={18}/> 스마트 셋리스트
          </button>
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="pt-12 md:pt-24 px-4 md:px-6 max-w-7xl mx-auto border-t border-[#78716A]/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-12 mt-6 md:mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-handwriting mb-1 md:mb-2 text-[#2D2926]">새로운 음반</h2>
            <p className="text-xs md:text-sm text-[#78716A]">가장 최근에 발매된 음반들을 들어보세요</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/music" className="w-full px-5 py-3 md:py-3 bg-[#2D2926] text-white rounded-full hover:bg-[#E6C79C] hover:text-[#2D2926] flex items-center justify-center font-bold text-[13px] md:text-sm transition-all shadow-sm">전체 듣기</Link>
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
                    <div className="w-14 h-14 rounded-full bg-white/90 text-[#C48C5E] flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
                       <Play className="w-6 h-6 fill-current ml-1" />
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

      {/* Featured Video Section */}
      <section className="pt-12 md:pt-24 px-4 md:px-6 max-w-7xl mx-auto border-t border-[#78716A]/10 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-12 mt-6 md:mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-handwriting mb-1 md:mb-2 text-[#2D2926]">iBigMedia 비주얼</h2>
            <p className="text-xs md:text-sm text-[#78716A]">공식 비디오, 라이브 워십, 강좌 및 다양한 영상들</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/video" className="w-full px-5 py-3 md:py-3 bg-[#FAF9F6] border border-[#78716A]/10 text-[#2D2926] rounded-full hover:bg-[#E6C79C]/20 flex items-center justify-center font-bold text-[13px] md:text-sm transition-all shadow-sm">전체 영상 보기</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestVideos.map((video) => (
              <div 
                key={video.id} 
                className="group cursor-pointer flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-[#78716A]/10 transform hover:-translate-y-2"
                onClick={() => setPreviewVideo(video)}
              >
                <div className="aspect-video relative overflow-hidden bg-black/5">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#78716A]/20">
                      <Play size={48} className="text-[#E6C79C]/50" />
                    </div>
                  )}
                  {/* Overlay Play Button */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#2D2926] shadow-xl transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                       <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1 relative">
                  <h3 className="font-bold text-xl text-[#2D2926] mb-3 leading-tight group-hover:text-[#C48C5E] transition-colors line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-[#78716A] line-clamp-2 font-light mb-4 flex-1">{video.description}</p>
                </div>
              </div>
            ))}
            {latestVideos.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#78716A]">아직 등록된 영상이 없습니다</div>
            )}
        </div>
      </section>

      {/* Featured Sheet Music Section */}
      <section className="pt-12 md:pt-24 px-4 md:px-6 max-w-7xl mx-auto mb-12 md:mb-20 border-t border-[#78716A]/10 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-12 mt-6 md:mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-handwriting mb-1 md:mb-2 text-[#2D2926]">악보 라이브러리</h2>
            <p className="text-xs md:text-sm text-[#78716A]">최신 등록된 고해상도 악보와 음원자료</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/sheets" className="w-full py-3 md:p-4 bg-white border border-[#78716A]/10 rounded-full hover:bg-[#78716A]/5 flex items-center justify-center transition-all shadow-sm"><ArrowRight size={20} className="text-[#78716A]"/></Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {latestSheets.map((sheet) => (
              <div key={sheet.id} className="bg-white p-6 md:p-8 rounded-3xl md:rounded-ibig shadow-sm border border-[#78716A]/5 group hover:shadow-xl transition-all relative overflow-hidden flex flex-col cursor-pointer" onClick={() => setPreviewSheet(sheet)}>
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
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheet(sheet);
                    }}
                    className="flex-1 py-4 bg-[#2D2926] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#78716A] transition-all shadow-md"
                  >
                    <BookOpen size={14}/> 악보보기
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheet(sheet);
                    }}
                    className="w-14 h-14 shrink-0 bg-[#FAF9F6] rounded-2xl flex items-center justify-center hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]"
                  >
                    <ArrowRight size={20}/>
                  </button>
                </div>
              </div>
            ))}
            {latestSheets.length === 0 && (
              <div className="col-span-3 text-center py-20 text-[#78716A]">아직 등록된 악보가 없습니다</div>
            )}
        </div>
      </section>

      {/* Featured Blog Section */}
      <section className="pt-12 md:pt-24 px-4 md:px-6 max-w-7xl mx-auto pb-8 md:pb-24 border-t border-[#78716A]/10 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-8 md:mb-12 mt-6 md:mt-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-handwriting mb-1 md:mb-2 text-[#2D2926]">ibiGmedia Journal</h2>
            <p className="text-xs md:text-sm text-[#78716A]">찬양은 삶의 고백이자 예술의 완성입니다</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/blog" className="w-full px-5 py-3 md:py-3 bg-[#FAF9F6] border border-[#78716A]/10 text-[#2D2926] rounded-full hover:bg-[#E6C79C]/20 flex items-center justify-center font-bold text-[13px] md:text-sm transition-all shadow-sm">
              더 보기 <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestBlogs.map((blog) => (
            <article 
              key={blog.id} 
              className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-[#78716A]/5 hover:-translate-y-2 transition-transform duration-300 cursor-pointer flex flex-col group"
              onClick={() => router.push(`/blog/${blog.id}`)}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                {blog.imageUrl ? (
                  <Image 
                    src={blog.imageUrl} 
                    alt={blog.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    unoptimized 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#78716A]/30">
                    <FileText size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-[10px] font-bold text-[#C48C5E] uppercase tracking-wider mb-2">
                  {blog.category || 'Journal'}
                </span>
                <h3 className="font-bold text-lg text-[#2D2926] leading-tight line-clamp-2 mb-3 group-hover:text-[#C48C5E] transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm text-[#78716A] line-clamp-3 font-light leading-relaxed mb-4 flex-1">
                  {blog.excerpt || blog.content.replace(/<[^>]+>/g, '')}
                </p>
                {/* Date and author removed as requested */}
              </div>
            </article>
          ))}
          {latestBlogs.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#78716A]">아직 작성된 저널이 없습니다</div>
          )}
        </div>
      </section>

      {/* Minimal Archive CTA Section */}
      <section className="py-10 md:py-16 px-4 md:px-6 max-w-2xl mx-auto text-center mt-6 md:mt-10 mb-12 md:mb-20 border-t border-[#78716A]/10">
        <h2 className="text-xl md:text-2xl font-bold text-[#2D2926] mb-2 md:mb-3">ibiGmedia 저장소</h2>
        <p className="text-[13px] md:text-sm text-[#78716A] mb-6 md:mb-8 font-light leading-relaxed">
          음악, 영상, 악보, 저널 등 ibiGband의 모든 컨텐츠를 한곳에서 검색하고 찾아보세요.
        </p>
        <Link href="/archive" className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-6 py-3 bg-[#FAF9F6] border border-[#78716A]/10 text-[#2D2926] rounded-full font-bold text-[13px] hover:bg-[#E6C79C]/10 transition-colors shadow-sm">
          <LayoutList size={16} /> 저장소 둘러보기 <ArrowRight size={16} className="ml-1" />
        </Link>
      </section>

      {previewSheet && (
        <SheetModal sheet={previewSheet} onClose={() => setPreviewSheet(null)} theme="light" />
      )}
      {previewVideo && (
        <VideoModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
    </div>
  );
}
