"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Music, FileText, List, ArrowRight, Play, PlayCircle, Heart, Download, BookOpen, LayoutList } from 'lucide-react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import SheetModal from '@/components/sheets/SheetModal';
import { Sheet } from '@/types/sheet';
import { Video as VideoType } from '@/types/video';
import VideoModal from '@/components/video/VideoModal';
import { useAuth } from '@/lib/firebase/auth';

export default function Home() {
  const router = useRouter();
  const t = useTranslations('home');
  const { user } = useAuth();
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
        // 1. Fetch latest 8 sheets — /api/sheets/list 가 등급에 맞춰 pdfUrl/audioUrl 을 마스킹합니다.
        try {
          const sheetHeaders: Record<string, string> = {};
          if (user) {
            try {
              const idToken = await user.getIdToken();
              sheetHeaders['Authorization'] = `Bearer ${idToken}`;
            } catch (tokenErr) {
              console.warn('홈 sheets: 토큰 발급 실패, 게스트로 요청:', tokenErr);
            }
          }
          const sheetsRes = await fetch('/api/sheets/list?limit=8', {
            headers: sheetHeaders,
            cache: 'no-store',
          });
          if (sheetsRes.ok) {
            const body = await sheetsRes.json() as { sheets: Array<Record<string, unknown>> };
            setLatestSheets((body.sheets || []).map((data) => ({
              ...data,
              title: typeof data.title === 'string' ? data.title.normalize('NFC') : data.title,
              artist: typeof data.artist === 'string' ? data.artist.normalize('NFC') : data.artist,
              releaseDate: new Date().toISOString(),
            })));
          }
        } catch (e) {
          console.error('홈 sheets 로드 실패:', e);
        }

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

        // 3. Fetch latest 5 music albums
        const qMusic = query(collection(db, 'music'), orderBy('createdAt', 'desc'), limit(5));
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

        // 4. Fetch latest 4 featured/latest videos
        const qVideos = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(4));
        const snapVideos = await getDocs(qVideos);
        setLatestVideos(snapVideos.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType)));
      } catch (error) {
        console.error('Error fetching latest content', error);
      }
    };
    fetchLatestContent();
    // user 가 바뀌면 sheets 마스킹 상태도 다시 가져옵니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="pt-20 md:pt-32 pb-4 min-h-[55vh] md:min-h-[85vh] flex flex-col items-center justify-center text-center px-4 md:px-6">
        {/* Band Image Container */}
        <div className="-mt-6 md:-mt-16 mb-8 md:mb-14 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[480px] lg:max-w-[600px] h-auto relative z-10 mx-auto opacity-90 transform transition-transform hover:scale-105 duration-500">
          <Image 
            src="/hero-band.png" 
            alt="ibiGband outline art" 
            width={600} 
            height={400} 
            className="w-full h-auto object-contain mix-blend-multiply" 
          />
        </div>
        <h1 className="text-[42px] sm:text-[60px] md:text-[88px] font-handwriting mb-3 md:mb-6 leading-[1.05] md:leading-[1.05] text-[#2D2926] relative z-10 tracking-[-0.06em] break-keep">
          {t('heroLine1')} <br />
          <span className="text-[#E6C79C] tracking-[-0.08em]">{t('heroHighlight')}</span>
        </h1>
        <p className="text-[#78716A] text-[14px] sm:text-[15px] md:text-lg max-w-xl mx-auto mb-10 md:mb-12 font-light leading-relaxed relative z-10 break-keep px-2 sm:px-0 tracking-tight">
          {t('heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center relative z-10 w-full px-6 md:px-0 max-w-xs sm:max-w-none mx-auto">
          <button onClick={() => router.push('/sheets')} className="bg-[#2D2926]/90 text-white px-6 py-4 md:px-10 md:py-4 rounded-full md:rounded-ibig flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:shadow-lg transition-all font-medium text-[15px] w-full sm:w-auto shadow-sm">
            <FileText size={18} className="opacity-80"/> {t('heroCtaSheets')}
          </button>
          <button onClick={() => router.push('/setlist')} className="bg-transparent border border-[#2D2926]/15 text-[#2D2926] px-6 py-4 md:px-10 md:py-4 rounded-full md:rounded-ibig flex items-center justify-center gap-2 hover:bg-[#2D2926]/5 transition-all font-medium text-[15px] w-full sm:w-auto">
            <List size={18} className="opacity-80"/> {t('heroCtaSetlist')}
          </button>
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto border-t border-[#78716A]/10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-4 md:mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-[40px] leading-tight md:text-6xl font-handwriting mb-1 md:mb-3 text-[#2D2926]">{t('musicTitle')}</h2>
            <p className="text-xs md:text-sm text-[#78716A]">{t('musicSubtitle')}</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/music" className="w-full px-5 py-3 md:py-2.5 bg-transparent border border-[#78716A]/15 text-[#78716A] rounded-full hover:bg-[#78716A]/5 hover:text-[#2D2926] flex items-center justify-center font-medium text-[13px] md:text-sm transition-all">{t('musicListenAll')}</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
            {latestMusic.map((album) => (
              <div 
                key={album.id} 
                className="group flex flex-col transition-transform duration-300 hover:-translate-y-2 cursor-pointer"
                onClick={() => router.push(`/music?albumId=${album.id}`)}
              >
                <div className="w-full aspect-square rounded-[24px] overflow-hidden mb-4 relative shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#2D2926]/15 bg-white">
                  {album.coverUrl ? (
                    <Image 
                      src={album.coverUrl} 
                      alt={album.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
                <div className="mt-auto self-start">
                  <button 
                    className="bg-transparent hover:bg-[#2D2926]/5 border border-[#78716A]/15 text-[#78716A] text-[11px] font-medium uppercase px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    onClick={(e) => {
                       e.stopPropagation();
                       router.push(`/music?albumId=${album.id}`);
                    }}
                  >
                    {t('musicPlayAlbum')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {latestMusic.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#78716A]">{t('musicEmpty')}</div>
            )}
        </div>
      </section>

      {/* Featured Video Section */}
      <section className="pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto border-t border-[#78716A]/10 mt-8 md:mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-4 md:mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-[40px] leading-tight md:text-6xl font-handwriting mb-1 md:mb-3 text-[#2D2926]">{t('videoTitle')}</h2>
            <p className="text-xs md:text-sm text-[#78716A]">{t('videoSubtitle')}</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/video" className="w-full px-5 py-3 md:py-2.5 bg-transparent border border-[#78716A]/15 text-[#78716A] rounded-full hover:bg-[#78716A]/5 hover:text-[#2D2926] flex items-center justify-center font-medium text-[13px] md:text-sm transition-all">{t('videoSeeAll')}</Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {latestVideos.map((video) => (
              <div 
                key={video.id} 
                className="group cursor-pointer flex flex-row md:flex-col h-auto md:h-full bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-[#78716A]/10"
                onClick={() => setPreviewVideo(video)}
              >
                <div className="w-1/3 md:w-full aspect-square md:aspect-video relative overflow-hidden bg-black/5 shrink-0">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#78716A]/20">
                      <Play size={24} className="text-[#E6C79C]/50 md:w-12 md:h-12" />
                    </div>
                  )}
                  {/* Overlay Play Button */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 md:group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 md:w-16 md:h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#2D2926] shadow-sm md:shadow-xl transform md:scale-90 md:opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 z-10">
                       <Play fill="currentColor" className="w-3 h-3 md:w-6 md:h-6 ml-0.5 md:ml-1" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 flex flex-col flex-1 justify-center relative bg-white md:bg-transparent">
                  <h3 className="font-bold text-[14px] md:text-xl text-[#2D2926] mb-1.5 md:mb-3 leading-tight group-hover:text-[#C48C5E] transition-colors line-clamp-2 md:line-clamp-2">{video.title}</h3>
                  <p className="text-[12px] md:text-sm text-[#78716A] line-clamp-2 font-light flex-1 mb-0 md:mb-4">{video.description}</p>
                </div>
              </div>
            ))}
            {latestVideos.length === 0 && (
              <div className="col-span-full text-center py-20 text-[#78716A]">{t('videoEmpty')}</div>
            )}
        </div>
      </section>

      {/* Featured Sheet Music Section */}
      <section className="pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto mb-8 md:mb-16 border-t border-[#78716A]/10 mt-8 md:mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-4 md:mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-[40px] leading-tight md:text-6xl font-handwriting mb-1 md:mb-3 text-[#2D2926]">{t('sheetsTitle')}</h2>
            <p className="text-xs md:text-sm text-[#78716A]">{t('sheetsSubtitle')}</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/sheets" className="w-full py-3 md:p-3 bg-transparent border border-[#78716A]/15 text-[#78716A] rounded-full hover:bg-[#78716A]/5 hover:text-[#2D2926] flex items-center justify-center transition-all"><ArrowRight size={18} className="md:w-5 md:h-5"/></Link>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {latestSheets.map((sheet) => (
              <div key={sheet.id} className="bg-white p-4 md:p-8 rounded-2xl md:rounded-ibig shadow-sm border border-[#78716A]/5 group hover:shadow-md transition-all relative flex flex-col cursor-pointer" onClick={() => setPreviewSheet(sheet)}>
                <div className="absolute top-0 right-0 p-3 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Music className="w-12 h-12 md:w-20 md:h-20 text-[#E6C79C]" />
                </div>
                <div className="flex justify-between items-start mb-3 md:mb-6 relative z-10 w-full">
                  {sheet.isPremiumOnly ? (
                     <div className="px-2 py-0.5 md:px-3 md:py-1 bg-[#E6C79C]/20 rounded-full text-[9px] md:text-[10px] font-bold text-[#2D2926] tracking-wider shrink-0">PREMIUM</div>
                  ) : (
                     <div className="px-2 py-0.5 md:px-3 md:py-1 bg-[#2D2926]/10 rounded-full text-[9px] md:text-[10px] font-bold text-[#2D2926] tracking-wider shrink-0">FREE</div>
                  )}
                  {sheet.youtubeId ? (
                     <PlayCircle className="w-4 h-4 md:w-[18px] md:h-[18px] text-[#E6C79C] shrink-0" />
                  ) : (
                     <Heart className="w-4 h-4 md:w-[18px] md:h-[18px] text-[#78716A] hover:text-red-400 shrink-0" />
                  )}
                </div>
                <h4 className="text-[15px] md:text-2xl font-handwriting mb-1 md:mb-2 text-[#2D2926] line-clamp-1 truncate relative z-10">{sheet.title}</h4>
                <p className="text-[10px] md:text-xs text-[#78716A] mb-4 md:mb-8 font-light italic truncate relative z-10 w-full">{sheet.artist || 'ibiGband'} | {sheet.key ? `${sheet.key} Key` : 'N/A'}</p>
                <div className="flex gap-2 mt-auto relative z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheet(sheet);
                    }}
                    className="flex-1 py-2.5 md:py-4 bg-transparent border border-[#78716A]/15 text-[#78716A] rounded-xl md:rounded-2xl text-[11px] md:text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#78716A]/5 hover:text-[#2D2926] transition-all"
                  >
                    <BookOpen size={12} className="md:w-[14px] md:h-[14px]" /> <span className="hidden sm:inline">{t('sheetsViewLong')}</span><span className="sm:hidden">{t('sheetsViewShort')}</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheet(sheet);
                    }}
                    className="w-9 h-9 md:w-14 md:h-14 shrink-0 bg-[#FAF9F6] border border-[#78716A]/10 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-[#E6C79C]/20 transition-all text-[#2D2926]"
                  >
                    <ArrowRight size={14} className="md:w-[20px] md:h-[20px]"/>
                  </button>
                </div>
              </div>
            ))}
            {latestSheets.length === 0 && (
              <div className="col-span-3 text-center py-20 text-[#78716A]">{t('sheetsEmpty')}</div>
            )}
        </div>
      </section>

      {/* Featured Blog Section */}
      <section className="pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto pb-6 md:pb-16 border-t border-[#78716A]/10 mt-8 md:mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-8 mt-4 md:mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-[40px] leading-tight md:text-6xl font-handwriting mb-1 md:mb-3 text-[#2D2926]">{t('blogTitle')}</h2>
            <p className="text-xs md:text-sm text-[#78716A]">{t('blogSubtitle')}</p>
          </div>
          <div className="flex w-full md:w-auto">
            <Link href="/blog" className="w-full px-5 py-3 md:py-2.5 bg-transparent border border-[#78716A]/15 text-[#78716A] rounded-full hover:bg-[#78716A]/5 hover:text-[#2D2926] flex items-center justify-center font-medium text-[13px] md:text-sm transition-all">
              {t('blogMore')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {latestBlogs.map((blog) => (
            <article 
              key={blog.id} 
              className="bg-white rounded-2xl md:rounded-[24px] overflow-hidden shadow-sm border border-[#78716A]/5 hover:shadow-md md:hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-row md:flex-col group"
              onClick={() => router.push(`/blog/${blog.id}`)}
            >
              <div className="w-1/3 md:w-full aspect-[3/4] md:aspect-[4/3] relative overflow-hidden bg-slate-100 shrink-0">
                {blog.imageUrl ? (
                  <Image 
                    src={blog.imageUrl} 
                    alt={blog.title} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105" 
                    unoptimized 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#78716A]/30">
                    <FileText size={24} className="md:w-12 md:h-12"/>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 md:bg-black/10 transition-opacity opacity-0 group-hover:opacity-100" />
              </div>
              <div className="p-4 md:p-6 flex flex-col flex-1 justify-center bg-white">
                <span className="text-[9px] md:text-[10px] font-bold text-[#C48C5E] uppercase tracking-wider mb-1 md:mb-2">
                  {blog.category || 'Journal'}
                </span>
                <h3 className="font-bold text-[14px] md:text-lg text-[#2D2926] leading-tight line-clamp-2 mb-1.5 md:mb-3 group-hover:text-[#C48C5E] transition-colors">
                  {blog.title}
                </h3>
                <p className="text-[12px] md:text-sm text-[#78716A] line-clamp-2 md:line-clamp-3 font-light leading-relaxed mb-0 flex-1">
                  {blog.excerpt || blog.content.replace(/<[^>]+>/g, '')}
                </p>
              </div>
            </article>
          ))}
          {latestBlogs.length === 0 && (
            <div className="col-span-full text-center py-20 text-[#78716A]">{t('blogEmpty')}</div>
          )}
        </div>
      </section>

      {/* Minimal Archive CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto mb-10 md:mb-16">
        <div className="bg-gradient-to-br from-[#FAF9F6] to-[#F2EFE9] border border-[#78716A]/10 rounded-[32px] md:rounded-[40px] px-6 py-10 md:py-12 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between text-center md:text-left relative overflow-hidden group gap-6 md:gap-8 shadow-sm">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#E6C79C]/20 rounded-full blur-[80px] group-hover:bg-[#E6C79C]/30 transition-colors z-0 pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#2D2926]/5 rounded-full blur-[80px] group-hover:bg-[#2D2926]/10 transition-colors z-0 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 flex-1">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white shadow-sm rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 rotate-3 group-hover:rotate-6 transition-transform">
               <LayoutList size={28} className="text-[#2D2926] md:w-8 md:h-8" />
            </div>
            
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-handwriting text-[#2D2926] mb-2 md:mb-3">
                {t('ctaTitle')}
              </h2>
              <p className="text-[13px] sm:text-[14px] md:text-[15px] text-[#78716A] font-light leading-relaxed max-w-lg md:max-w-xl">
                {t('ctaBody')}
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 w-full md:w-auto mt-4 md:mt-0">
             <Link href="/archive" className="inline-flex w-full md:w-auto justify-center items-center gap-2 px-8 py-4 md:py-4 bg-[#2D2926]/90 text-white rounded-full hover:bg-[#2D2926] hover:shadow-lg hover:-translate-y-1 transition-all font-medium text-[14px] md:text-base cursor-pointer">
               {t('ctaButton')} <ArrowRight size={18} className="ml-1 opacity-80" />
             </Link>
          </div>
        </div>
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
