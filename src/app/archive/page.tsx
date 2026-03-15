"use client";

import React, { useState, useEffect } from 'react';
import { Search, LayoutList, LayoutGrid, FolderTree, Tag as TagIcon, Play, FileText, Music, ExternalLink, Activity, ArrowUpRight } from 'lucide-react';
import { getCollectionDocs } from '@/lib/firebase/firestore';
import { BlogPost, SheetMusic } from '@/lib/firebase/firestore';
import { Video } from '@/types/video';
import { MusicAlbum } from '@/types/music';
import Image from 'next/image';
import Link from 'next/link';

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
  
  // To collect all unique tags across items
  const [allTags, setAllTags] = useState<string[]>([]);

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
            link: `/music?a=${album.id}`,
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
    <div className="pt-24 md:pt-32 px-4 md:px-6 max-w-7xl mx-auto mb-16 md:mb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="text-left w-full">
          <h2 className="text-3xl md:text-5xl font-handwriting text-[#2D2926] mb-2 md:mb-3">저장소 (Archive)</h2>
          <p className="text-[13px] md:text-base text-[#78716A]">모든 미디어와 인사이트를 한눈에 파악하고 검색하세요.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#2D2926]/90 backdrop-blur-md p-3 md:p-4 rounded-[20px] md:rounded-2xl shadow-lg border border-white/10 mb-6 md:mb-8 flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between sticky top-[70px] md:top-[80px] z-10">

        <div className="flex gap-2 md:gap-4 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
          <div className="relative shrink-0 w-[120px] md:w-64">
            <Search className="absolute left-3 top-2.5 text-white/50" size={14} />
            <input 
              type="text" 
              placeholder="제목, 내용 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-full text-[13px] md:text-sm text-white/90 focus:outline-none focus:border-white/30 focus:bg-white/10 placeholder:text-white/40 transition-colors"
            />
          </div>
          <select 
            className="px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[13px] md:text-sm font-medium text-white/90 outline-none cursor-pointer shrink-0 transition-colors focus:bg-[#2D2926] hover:bg-white/10 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all" className="bg-[#2D2926]">모든 형태</option>
            <option value="video" className="bg-[#2D2926]">영상</option>
            <option value="blog" className="bg-[#2D2926]">저널 (블로그)</option>
            <option value="sheet" className="bg-[#2D2926]">악보 및 음원</option>
          </select>
          <select 
            className="px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[13px] md:text-sm font-medium text-white/90 outline-none cursor-pointer shrink-0 transition-colors focus:bg-[#2D2926] hover:bg-white/10 appearance-none"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all" className="bg-[#2D2926]">모든 태그</option>
            {allTags.map(tag => <option key={tag} value={tag} className="bg-[#2D2926]">#{tag}</option>)}
          </select>
        </div>

        <div className="flex p-1 bg-white/5 rounded-full shrink-0 border border-white/5">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white/20 shadow-sm text-white' : 'text-white/50 hover:text-white/90'}`}
            title="리스트 뷰"
          >
            <LayoutList size={18} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white/20 shadow-sm text-white' : 'text-white/50 hover:text-white/90'}`}
            title="그리드 뷰"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('category')}
            className={`p-2 rounded-full transition-colors ${viewMode === 'category' ? 'bg-white/20 shadow-sm text-white' : 'text-white/50 hover:text-white/90'}`}
            title="카테고리 뷰"
          >
            <FolderTree size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#78716A] animate-pulse">Loading Archive...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center text-[#78716A]">검색 결과가 없습니다.</div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div className="flex flex-col gap-3 md:gap-4 w-full">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#78716A]/10 text-xs font-bold text-[#78716A] tracking-wider uppercase w-full">
                <div className="col-span-6 lg:col-span-5">정보</div>
                <div className="col-span-2 text-center">형식</div>
                <div className="col-span-3 text-center">태그</div>
                <div className="col-span-1 lg:col-span-2 text-right">링크</div>
              </div>
              {filteredItems.map(item => (
                <Link key={item.id} href={item.link} className="block group w-full">
                  <div className="bg-white hover:bg-[#FAF9F6] border border-[#78716A]/5 rounded-2xl md:rounded-[32px] p-3 md:p-4 md:px-6 transition-all shadow-sm group-hover:shadow-md flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center relative w-full overflow-hidden">
                    
                    {/* ======== 모바일 뷰 최적화 레이아웃 ======== */}
                    <div className="flex gap-3 md:hidden w-full items-stretch">
                      <div className="w-[100px] h-20 rounded-xl bg-[#2D2926] overflow-hidden shrink-0 relative flex-none">
                        {item.thumbnailUrl && item.thumbnailUrl !== '/default-blog.jpg' ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#78716A] text-[10px] italic">No Img</div>
                        )}
                        <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm p-1 rounded-full shadow-sm text-[#2D2926]">
                          {getTypeIcon(item.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="mb-1">
                          <h3 className="font-bold text-[#2D2926] text-[14px] leading-tight line-clamp-2 pr-6 relative">
                            {item.title}
                            <ArrowUpRight size={14} className="absolute right-0 top-0 text-[#C48C5E] shrink-0 font-bold" />
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                          <span className="text-[9px] font-bold text-[#2D2926] uppercase bg-[#FAF9F6] border border-[#78716A]/10 px-2 py-0.5 rounded-md">
                            {getTypeName(item.type)}
                          </span>
                          {item.tags.length > 0 && <span className="text-[10px] text-[#78716A] truncate max-w-[80px]">#{item.tags[0]}</span>}
                          {item.tags.length > 1 && <span className="text-[10px] text-[#78716A] hidden sm:inline truncate max-w-[60px]">#{item.tags[1]}</span>}
                          {item.tags.length > 1 && <span className="text-[10px] text-[#78716A] sm:hidden">+{item.tags.length - 1}</span>}
                          {item.tags.length > 2 && <span className="text-[10px] text-[#78716A] hidden sm:inline">+{item.tags.length - 2}</span>}
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
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <Link key={item.id} href={item.link} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-[#78716A]/5 overflow-hidden hover:shadow-md transition-all h-full">
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
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-[#2D2926] text-lg leading-tight mb-2 line-clamp-2 group-hover:text-[#C48C5E] transition-colors">{item.title}</h3>
                    <p className="text-xs text-[#78716A] line-clamp-2 mb-4 flex-1">{item.description}</p>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-[#78716A] bg-[#FAF9F6] px-1.5 py-0.5 rounded-sm">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-[#78716A]/5 mt-auto">
                      <span className="text-[10px] text-[#78716A]">{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                      <ArrowUpRight size={16} className="text-[#78716A] group-hover:text-[#2D2926]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {viewMode === 'category' && (
            <div className="space-y-12">
              {Object.keys(groupedItems).map(type => (
                <div key={type} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#78716A]/5">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#78716A]/10">
                    <div className="p-3 bg-[#FAF9F6] rounded-xl">{getTypeIcon(type as MediaType)}</div>
                    <h3 className="text-2xl font-bold text-[#2D2926]">{getTypeName(type as MediaType)} <span className="text-sm font-normal text-[#78716A] ml-2">{groupedItems[type].length}개</span></h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedItems[type].map(item => (
                      <Link key={item.id} href={item.link} className="flex gap-4 items-center group p-3 rounded-2xl hover:bg-[#FAF9F6] border border-transparent hover:border-[#78716A]/10 transition-all">
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#2D2926] shrink-0">
                          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-sm text-[#2D2926] truncate group-hover:text-[#C48C5E] transition-colors">{item.title}</h4>
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
    </div>
  );
}
