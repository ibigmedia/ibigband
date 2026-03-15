"use client";

import React, { useState, useEffect } from 'react';
import { Search, LayoutList, LayoutGrid, FolderTree, Tag as TagIcon, Play, FileText, Music, ExternalLink, Activity, ArrowUpRight } from 'lucide-react';
import { getCollectionDocs } from '@/lib/firebase/firestore';
import { BlogPost, SheetMusic } from '@/lib/firebase/firestore';
import { Video } from '@/types/video';
import { MusicAlbum } from '@/types/music';
import Image from 'next/image';
import Link from 'next/link';
import VideoModal from '@/components/video/VideoModal';
import SheetModal from '@/components/sheets/SheetModal';
import { Sheet } from '@/types/sheet';

type MediaType = 'blog' | 'video' | 'sheet' | 'music' | 'seeker';

interface ArchiveItem {
  id: string;
  type: MediaType;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: number;
  tags: string[];
  link: string;
  rawItem?: any;
  metadata?: {
    bpm?: number | string;
    key?: string;
    author?: string;
    isPremium?: boolean;
    duration?: string;
  };
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'category'>('list');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [previewSheet, setPreviewSheet] = useState<SheetMusic | null>(null);

  // To collect all unique tags across items
  const [allTags, setAllTags] = useState<string[]>([]);

  const handleItemClick = (e: React.MouseEvent, item: ArchiveItem) => {
    if (item.type === 'video' && item.rawItem) {
      e.preventDefault();
      setPreviewVideo(item.rawItem);
    } else if (item.type === 'sheet' && item.rawItem) {
      e.preventDefault();
      setPreviewSheet(item.rawItem);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [blogs, videos, sheets, musicAlbums] = await Promise.all([
          getCollectionDocs<BlogPost>('blogs').catch(() => [] as BlogPost[]),
          getCollectionDocs<Video>('videos').catch(() => [] as Video[]),
          getCollectionDocs<SheetMusic>('sheets').catch(() => [] as SheetMusic[]),
          getCollectionDocs<MusicAlbum>('music').catch(() => [] as MusicAlbum[])
        ]);

        const formattedItems: ArchiveItem[] = [];
        const tagsSet = new Set<string>();

        // Format Blogs
        blogs.forEach(blog => {
          blog.tags?.forEach(t => tagsSet.add(t));
          formattedItems.push({
            id: blog.id!,
            type: 'blog',
            title: blog.title,
            description: blog.content?.substring(0, 100).replace(/<[^>]+>/g, '') || '',
            thumbnailUrl: blog.imageUrl || '/default-blog.jpg', // Replace with a better placeholder if needed
            createdAt: blog.createdAt,
            tags: blog.tags || [],
            link: `/blog/${blog.id}`,
            metadata: { author: blog.authorId }
          });
        });

        // Format Videos
        videos.forEach(video => {
          // If video doesn't have tags natively, we can extract some or just say empty
          formattedItems.push({
            id: video.id,
            type: 'video',
            title: video.title,
            description: video.description || '',
            thumbnailUrl: video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeUrl?.split('v=')[1] || ''}/mqdefault.jpg`,
            createdAt: video.createdAt,
            tags: [], // Could add default tags like 'youtube', 'video'
            link: `/video?v=${video.id}`, // Custom link logic if needed, or open modal
            rawItem: video
          });
        });

        // Format Sheets
        sheets.forEach(sheet => {
          sheet.moodTags?.forEach(t => tagsSet.add(t));
          formattedItems.push({
            id: sheet.id!,
            type: 'sheet',
            title: sheet.title,
            description: `Key: ${sheet.key || '-'} | BPM: ${sheet.bpm || '-'}`,
            thumbnailUrl: sheet.thumbnailUrl || '/default-sheet.jpg',
            createdAt: sheet.createdAt || Date.now(),
            tags: sheet.moodTags || [],
            link: `/sheets?s=${sheet.id}`,
            rawItem: sheet,
            metadata: { key: sheet.key, bpm: sheet.bpm, isPremium: sheet.isPremiumOnly }
          });
        });

        // Format Music
        musicAlbums.forEach(album => {
          formattedItems.push({
            id: album.id!,
            type: 'music',
            title: album.title,
            description: album.description || `${album.type || 'Album'}`,
            thumbnailUrl: album.coverUrl || '/default-music.jpg',
            createdAt: album.createdAt || (album.releaseDate ? new Date(album.releaseDate).getTime() : Date.now()),
            tags: album.type ? [album.type.toLowerCase()] : [],
            link: `/music?albumId=${album.id}`,
          });
        });

        // Sort by newest
        formattedItems.sort((a, b) => b.createdAt - a.createdAt);

        setItems(formattedItems);
        setAllTags(Array.from(tagsSet));
      } catch (error) {
        console.error("Error fetching archive data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'video': return <Play size={14} className="text-red-500" />;
      case 'blog': return <FileText size={14} className="text-blue-500" />;
      case 'sheet': return <Music size={14} className="text-amber-500" />;
      case 'music': return <Activity size={14} className="text-purple-500" />;
      default: return <ExternalLink size={14} />;
    }
  };

  const getTypeName = (type: MediaType) => {
    switch (type) {
      case 'video': return '영상';
      case 'blog': return '저널';
      case 'sheet': return '악보';
      case 'music': return '음원';
      case 'seeker': return '구도자';
      default: return '기타';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesTag = filterTag === 'all' || item.tags.includes(filterTag);
    return matchesSearch && matchesType && matchesTag;
  });

  // Group by category for 'category' mode
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ArchiveItem[]>);

  return (
    <div className="pt-6 px-4 md:px-6 max-w-7xl mx-auto mb-16 md:mb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="text-left w-full">
          <h2 className="text-3xl md:text-5xl font-handwriting text-[#2D2926] mb-2 md:mb-3">저장소 (Archive)</h2>
          <p className="text-[13px] md:text-base text-[#78716A]">모든 미디어와 인사이트를 한눈에 파악하고 검색하세요.</p>
        </div>
      </div>

      {/* Control Bar - Mobile Optimized Material 3 Layout */}
      <div className="bg-[#2D2926]/95 backdrop-blur-xl p-3 md:p-4 rounded-[24px] shadow-lg border border-white/10 mb-6 md:mb-8 flex flex-col md:flex-row gap-3 md:gap-4 sticky top-[70px] md:top-[80px] z-10 w-full overflow-hidden items-center justify-between">
        
        {/* Mobile Top Row / Desktop Left Side: Search & View Modes */}
        <div className="flex gap-3 justify-between items-center w-full md:w-auto md:flex-1">
          <div className="relative flex-1 md:max-w-md lg:max-w-lg">
            <Search className="absolute left-3 top-2.5 text-white/50" size={16} />
            <input 
              type="text" 
              placeholder="제목, 내용 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-[14px] md:text-sm text-white/90 focus:outline-none focus:border-white/30 focus:bg-[#2D2926] placeholder:text-white/40 transition-colors shadow-inner"
            />
          </div>
          
          <div className="flex p-1 bg-white/5 rounded-full shrink-0 border border-white/5 self-center md:hidden">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all ${viewMode === 'list' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="리스트 뷰"
            >
              <LayoutList size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="그리드 뷰"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('category')}
              className={`p-1.5 rounded-full transition-all ${viewMode === 'category' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="카테고리 뷰"
            >
              <FolderTree size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Row / Desktop Right Side: Filters & View Modes */}
        <div className="flex gap-2.5 md:gap-4 w-full md:w-auto justify-between md:justify-end items-center shrink-0">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-40">
              <select 
                className="w-full px-3 py-2 bg-[#2D2926]/50 border border-white/10 rounded-xl md:rounded-full text-[13px] md:text-sm font-medium text-white/90 outline-none cursor-pointer transition-colors focus:bg-[#2D2926] focus:border-white/30 hover:bg-white/10 appearance-none pr-8 truncate shadow-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="all" className="bg-[#2D2926]">모든 형태</option>
                <option value="video" className="bg-[#2D2926]">🎵 영상</option>
                <option value="blog" className="bg-[#2D2926]">📝 저널</option>
                <option value="sheet" className="bg-[#2D2926]">🎼 악보/음원</option>
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            
            <div className="relative flex-1 md:w-40">
              <select 
                className="w-full px-3 py-2 bg-[#2D2926]/50 border border-white/10 rounded-xl md:rounded-full text-[13px] md:text-sm font-medium text-white/90 outline-none cursor-pointer transition-colors focus:bg-[#2D2926] focus:border-white/30 hover:bg-white/10 appearance-none pr-8 truncate shadow-sm"
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
              >
                <option value="all" className="bg-[#2D2926]">태그 전체</option>
                {allTags.map(tag => <option key={tag} value={tag} className="bg-[#2D2926]">#{tag}</option>)}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          <div className="hidden md:flex p-1 bg-white/5 rounded-full shrink-0 border border-white/5 ml-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="리스트 뷰"
            >
              <LayoutList size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="그리드 뷰"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('category')}
              className={`p-2 rounded-full transition-all ${viewMode === 'category' ? 'bg-white/20 shadow-sm text-white scale-105' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
              title="카테고리 뷰"
            >
              <FolderTree size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#78716A] animate-pulse">Loading Archive...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center text-[#78716A]">검색 결과가 없습니다.</div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="flex flex-col md:gap-4 w-full">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#78716A]/10 text-xs font-bold text-[#78716A] tracking-wider uppercase w-full">
                <div className="col-span-6 lg:col-span-5">정보</div>
                <div className="col-span-2 text-center">형식</div>
                <div className="col-span-3 text-center">태그</div>
                <div className="col-span-1 lg:col-span-2 text-right">링크</div>
              </div>
              <div className="flex flex-col divide-y divide-[#78716A]/10 md:divide-none md:gap-4">
                {filteredItems.map(item => (
                  <Link 
                    key={item.id} 
                    href={item.link} 
                    className="block group h-full"
                    onClick={(e) => handleItemClick(e, item)}
                  >
                    <div className="py-4 md:py-4 px-1 md:px-6 md:bg-white md:hover:bg-[#FAF9F6] md:border md:border-[#78716A]/5 md:rounded-[32px] transition-all md:shadow-sm md:group-hover:shadow-md flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center relative w-full">
                      
                      {/* ======== 모바일 뷰 최적화 레이아웃 ======== */}
                      <div className="flex gap-3.5 md:hidden w-full items-start">
                        <div className="w-[100px] h-[70px] rounded-[10px] bg-[#2D2926] overflow-hidden shrink-0 relative flex-none shadow-sm">
                          {item.thumbnailUrl && item.thumbnailUrl !== '/default-blog.jpg' ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#FAF9F6] border border-[#78716A]/10 text-[#78716A] text-[10px] italic">No Img</div>
                          )}
                          <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-sm text-[#2D2926]">
                            {getTypeIcon(item.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-start">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-bold text-[#2D2926] text-[15px] leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                            <ArrowUpRight size={15} className="text-[#C48C5E] shrink-0 mt-0.5" />
                          </div>
                          <p className="text-[12px] text-[#78716A] line-clamp-1 mb-2 w-[90%]">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                            <span className="text-[9px] font-bold text-[#2D2926] uppercase bg-white border border-[#78716A]/10 shadow-sm px-1.5 py-0.5 rounded">
                              {getTypeName(item.type)}
                            </span>
                            {item.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] text-[#78716A] truncate max-w-[60px]">#{tag}</span>
                            ))}
                            {item.tags.length > 2 && <span className="text-[10px] text-[#78716A]">+{item.tags.length - 2}</span>}
                          </div>
                        </div>
                      </div>

                      {/* ======== 데스크탑 뷰 레이아웃 ======== */}
                      <div className="hidden md:contents">
                        <div className="col-span-6 lg:col-span-5 flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-[#2D2926] overflow-hidden shrink-0 relative">
                            {item.thumbnailUrl && item.thumbnailUrl !== '/default-blog.jpg' ? (
                              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#78716A] text-[10px] italic">No Img</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[#2D2926] text-[15px] truncate">{item.title}</h3>
                            <p className="text-xs text-[#78716A] truncate mt-0.5">{item.description}</p>
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-[#FAF9F6] rounded-full w-fit mx-auto border border-[#78716A]/10">
                          {getTypeIcon(item.type)}
                          <span className="text-[11px] font-bold text-[#2D2926] uppercase">{getTypeName(item.type)}</span>
                        </div>

                        <div className="col-span-3 flex flex-wrap items-center justify-center gap-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] text-[#78716A] bg-white border border-[#78716A]/10 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && <span className="text-[10px] text-[#78716A]">+{item.tags.length - 3}</span>}
                        </div>

                        <div className="col-span-1 lg:col-span-2 flex justify-end">
                          <div className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#78716A]/10 flex items-center justify-center group-hover:bg-[#E6C79C] group-hover:text-white transition-colors text-[#2D2926]">
                            <ArrowUpRight size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredItems.map(item => (
                <Link key={item.id} href={item.link} className="group flex flex-col bg-white rounded-2xl md:rounded-[24px] shadow-sm border border-[#78716A]/5 overflow-hidden hover:shadow-md transition-all h-full">
                  <div className="relative aspect-video w-full bg-[#FAF9F6]">
                    {item.thumbnailUrl && item.thumbnailUrl !== '/default-blog.jpg' ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#78716A] italic font-light text-sm">No Image</div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      {getTypeIcon(item.type)}
                      <span className="text-[10px] font-bold text-[#2D2926] uppercase">{getTypeName(item.type)}</span>
                    </div>
                  </div>
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-[#2D2926] text-[15px] md:text-lg leading-tight mb-1.5 md:mb-2 line-clamp-2 group-hover:text-[#C48C5E] transition-colors">{item.title}</h3>
                    <p className="text-xs text-[#78716A] line-clamp-2 mb-3 md:mb-4 flex-1">{item.description}</p>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-[#78716A] bg-[#FAF9F6] border border-[#78716A]/10 px-1.5 py-0.5 rounded-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 md:pt-3 border-t border-[#78716A]/5 mt-auto">
                      <span className="text-[10px] text-[#78716A]">{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                      <ArrowUpRight size={14} className="text-[#78716A] group-hover:text-[#2D2926]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {viewMode === 'category' && (
            <div className="space-y-6 md:space-y-12">
              {Object.keys(groupedItems).map(type => (
                <div key={type} className="bg-white p-4 md:p-8 rounded-[20px] md:rounded-3xl shadow-sm border border-[#78716A]/5">
                  <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-[#78716A]/10">
                    <div className="p-2 md:p-3 bg-[#FAF9F6] rounded-lg md:rounded-xl">{getTypeIcon(type as MediaType)}</div>
                    <h3 className="text-xl md:text-2xl font-bold text-[#2D2926]">{getTypeName(type as MediaType)} <span className="text-xs md:text-sm font-normal text-[#78716A] ml-2">{groupedItems[type].length}개</span></h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {groupedItems[type].map(item => (
                      <Link key={item.id} href={item.link} className="flex gap-3 md:gap-4 items-center group p-2 md:p-3 rounded-2xl hover:bg-[#FAF9F6] border border-transparent hover:border-[#78716A]/10 transition-all">
                        <div className="w-[80px] h-[55px] md:w-20 md:h-14 rounded-lg overflow-hidden bg-[#2D2926] shrink-0 border border-[#78716A]/10">
                          {item.thumbnailUrl && item.thumbnailUrl !== '/default-blog.jpg' ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#FAF9F6] text-[#78716A] text-[8px] italic">No Img</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-1">
                          <h4 className="font-bold text-[13px] md:text-sm text-[#2D2926] truncate group-hover:text-[#C48C5E] transition-colors">{item.title}</h4>
                          <p className="text-[11px] text-[#78716A] truncate mt-0.5">{item.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {previewVideo && (
        <VideoModal 
          video={previewVideo} 
          onClose={() => setPreviewVideo(null)} 
        />
      )}

      {previewSheet && previewSheet.id && (
        <SheetModal 
          sheet={previewSheet as unknown as Sheet} 
          onClose={() => setPreviewSheet(null)} 
        />
      )}
    </div>
  );
}
