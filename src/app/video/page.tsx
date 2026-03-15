"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Video as VideoType } from '@/types/video';
import VideoModal from '@/components/video/VideoModal';
import { Play, Video } from 'lucide-react';
import Image from 'next/image';

export default function VideoLibraryPage() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [previewVideo, setPreviewVideo] = useState<VideoType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, 'videos'));
        const snap = await getDocs(q);
        const fetchedVideos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoType));
        
        fetchedVideos.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return timeB - timeA;
        });

        setVideos(fetchedVideos);
      } catch (error) {
        console.error('Failed to fetch videos', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <div className="flex-1 bg-[#FAF9F6]">
      {/* Hero Section */}
      <section className="bg-[#2D2926] pt-32 pb-24 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-[#E6C79C] text-sm font-bold tracking-widest uppercase mb-4 py-1 flex items-center gap-2">
             <Video size={16} /> iBigMedia Visuals
          </span>
          <h1 className="text-4xl md:text-6xl font-handwriting text-white mb-6 leading-tight break-keep">
            눈으로 보는 찬양의 울림
          </h1>
          <p className="text-[#78716A] text-lg max-w-2xl font-light mb-8 break-keep">
            iBigBand의 공식 뮤직비디오, 라이브 워십, 강좌 등 <br className="hidden md:block"/>
            다양한 영상 콘텐츠를 통해 더 깊은 은혜를 경험하세요.
          </p>
          <a href="https://www.youtube.com/@dkdlqlr" target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-transform hover:-translate-y-1 shadow-lg shadow-red-900/20">
             <Play size={18} fill="currentColor" /> Youtube 채널 구독하기
          </a>
        </div>
      </section>

      {/* Video Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-32 text-[#78716A]">영상 데이터를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12">
            {videos.map(video => (
              <div 
                key={video.id} 
                className="group cursor-pointer flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-[#78716A]/10 transform hover:-translate-y-2"
                onClick={() => setPreviewVideo(video)}
              >
                <div className="aspect-video relative overflow-hidden bg-black/5">
                  {video.thumbnailUrl ? (
                    <Image 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      fill 
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#78716A]/20">
                      <Video size={48} />
                    </div>
                  )}
                  
                  {/* Overlay Play Button */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#2D2926] shadow-xl transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                       <Play size={24} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                  
                  {/* Featured Badge */}
                  {video.featured && (
                    <div className="absolute top-4 left-4 bg-[#E6C79C] text-[#2D2926] text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-lg">
                      Featured
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] uppercase font-bold px-2 py-1 flex items-center gap-1 rounded shadow-md">
                     {video.createdAt ? new Date(video.createdAt?.toMillis?.() || video.createdAt || Date.now()).toLocaleDateString() : '최신'}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1 relative">
                  <h3 className="font-bold text-xl text-[#2D2926] mb-3 leading-tight group-hover:text-[#C48C5E] transition-colors">{video.title}</h3>
                  <p className="text-sm text-[#78716A] line-clamp-2 md:line-clamp-3 font-light mb-4 flex-1">{video.description}</p>
                  
                  {/* Tags / Links snippet */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-[#78716A]/10">
                     {video.relatedLinks && video.relatedLinks.length > 0 ? (
                        <div className="text-xs text-[#E6C79C] font-bold uppercase tracking-wider">
                           {video.relatedLinks.length}개의 관련 서비스 제공
                        </div>
                     ) : (
                        <div className="text-xs text-[#78716A] font-light">
                           단독 영상 콘텐츠
                        </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
            
            {videos.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center text-[#78716A]">등록된 영상이 없습니다. 곧 멋진 영상으로 채워질 예정입니다.</div>
            )}
          </div>
        )}
      </section>

      {/* Main Video Overlay Modal */}
      {previewVideo && (
        <VideoModal video={previewVideo} onClose={() => setPreviewVideo(null)} />
      )}
    </div>
  );
}
