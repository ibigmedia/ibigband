"use client";

import React, { useEffect, useState } from 'react';
import { Video as VideoType } from '@/types/video';
import { X, ExternalLink, Music, BookOpen, Crown, ShoppingBag, Video } from 'lucide-react';
import Link from 'next/link';

interface VideoModalProps {
  video: VideoType | null;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (video) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [video]);

  if (!mounted || !video) return null;

  // Extract YouTube ID
  let youtubeId = '';
  if (video.youtubeUrl) {
    const match = video.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (match && match[1]) {
      youtubeId = match[1];
    }
  }

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'sheet': return <BookOpen size={16} />;
      case 'music': return <Music size={16} />;
      case 'premium': return <Crown size={16} />;
      case 'merch': return <ShoppingBag size={16} />;
      default: return <ExternalLink size={16} />;
    }
  };

  const getLinkColors = (type: string) => {
    switch (type) {
      case 'sheet': return 'bg-[#2D2926] text-white hover:bg-black';
      case 'music': return 'bg-[#FAF9F6] border border-[#78716A]/20 text-[#2D2926] hover:bg-[#E6C79C]/20';
      case 'premium': return 'bg-gradient-to-r from-[#E6C79C] to-[#C48C5E] text-white hover:opacity-90';
      case 'merch': return 'bg-[#E6C79C]/20 text-[#2D2926] hover:bg-[#E6C79C]/40 border border-[#E6C79C]/30';
      default: return 'bg-white border border-[#78716A]/20 text-[#2D2926] hover:bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
        >
          <X size={20} />
        </button>

        {/* Video Player Section */}
        <div className="w-full md:w-2/3 bg-black flex flex-col relative aspect-video md:aspect-auto min-h-[300px] md:min-h-full">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          ) : video.videoUrl ? (
            <video 
              src={video.videoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain absolute inset-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
              <Video size={48} className="mb-4" />
              <p>영상을 찾을 수 없습니다.</p>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="w-full md:w-1/3 bg-[#FAF9F6] border-l border-[#78716A]/10 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="mb-6 mb-auto pb-6 border-b border-[#78716A]/10">
            <span className="text-[10px] uppercase font-bold text-[#C48C5E] tracking-widest bg-[#E6C79C]/20 px-3 py-1.5 rounded-full inline-block mb-4">
              {youtubeId ? 'YOUTUBE' : 'ibiGmedia'}
            </span>
            <h2 className="text-2xl font-bold text-[#2D2926] mb-4 leading-tight">
              {video.title}
            </h2>
            <div className="text-[#78716A] text-sm whitespace-pre-wrap font-light leading-relaxed">
              {video.description}
            </div>
          </div>

          <div className="space-y-4">
            {video.relatedLinks && video.relatedLinks.length > 0 && (
              <>
                <h3 className="text-sm font-bold text-[#2D2926] uppercase tracking-wider mb-2">💡 연결된 콘텐츠 및 서비스</h3>
                <div className="flex flex-col gap-2">
                  {video.relatedLinks.map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.url}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm shadow-sm ${getLinkColors(link.type)}`}
                      target={link.url.startsWith('http') ? '_blank' : undefined}
                      rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <div className="shrink-0">{getLinkIcon(link.type)}</div>
                      <span className="flex-1">{link.title}</span>
                      <ExternalLink size={14} className="opacity-50" />
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-[#78716A]/10">
              <div className="bg-white border border-[#E6C79C]/30 p-4 rounded-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-[#2D2926] rounded-full flex items-center justify-center text-[#E6C79C] font-bold text-xl mb-3 shadow-lg">i</div>
                <h4 className="font-bold text-[#2D2926] mb-1">iBigMedia 유튜브</h4>
                <p className="text-xs text-[#78716A] mb-3">구독하고 더 많은 영상을 만나보세요!</p>
                <a 
                  href="https://www.youtube.com/@dkdlqlr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-red-700 transition-colors w-full"
                >
                  채널 구경가기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
