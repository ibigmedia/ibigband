"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, BookOpen, Headphones, Video } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'existence', label: '존재와 우주' },
  { id: 'history', label: '역사와 문서' },
  { id: 'science', label: '과학과 신앙' },
  { id: 'pain', label: '고통과 공의' },
  { id: 'church', label: '교회와 종교' },
  { id: 'personal', label: '개인과 신앙' }
];

export default function SeekersPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /** HTML sanitizer — br, em, strong, a 등 기본 서식만 허용 */
  const clean = (dirty: string) => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['br', 'em', 'strong', 'b', 'i', 'a', 'p', 'span', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'seekers'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => {
          const docData = doc.data();
          return { id: doc.id, ...docData, category: docData.category || 'existence' };
        });
        setData(items);

        const settingsDoc = await getDoc(doc(db, 'pages', 'seekers'));
        if (settingsDoc.exists()) {
          const s = settingsDoc.data();
          setSettings(s);

          if (s.playlists && s.playlists.length > 0) {
            const mSnap = await getDocs(collection(db, 'music'));
            const matches = mSnap.docs.map(d => ({id: d.id, ...d.data()}));
            const filtered = s.playlists.map((pid: string) => matches.find(m => m.id === pid)).filter(Boolean);
            setPlaylist(filtered);
          }
        }
      } catch (err) {
        console.error('Failed to fetch seekers data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 0) {
      setActiveFilter('all');
    }
  };

  const filteredData = useMemo(() => {
    let result = data;
    if (activeFilter !== 'all') {
      result = result.filter(item => item.category === activeFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const kw = (item.keywords || '') + ' ' + (item.question || '');
        return kw.toLowerCase().includes(q);
      });
    }
    return result;
  }, [activeFilter, searchQuery, data]);

  const categoriesWithItems = useMemo(() => {
    const cats = new Set(filteredData.map(item => item.category));
    return cats;
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2926] font-sans antialiased text-[15px] leading-[1.7] font-light selection:bg-[#C48C5E] selection:text-[#FAF9F6]">
       <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s ease forwards; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }
      `}} />

      {/* Hero */}
      <section 
        className="px-5 md:px-10 max-w-[900px] mx-auto pt-[7rem] md:pt-0 pb-[3rem] md:pb-0"
        style={{
          paddingTop: settings?.heroPaddingTop || undefined,
          paddingBottom: settings?.heroPaddingBottom || undefined,
          textAlign: (settings?.heroTextAlign as any) || 'center'
        }}
      >
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.25em] text-[#C48C5E] uppercase mb-8 animate-fade-up delay-200" dangerouslySetInnerHTML={{ __html: clean(settings?.heroLabel || 'Seekers / 구도자') }} />
        <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-[#2D2926] mb-8 animate-fade-up delay-400" dangerouslySetInnerHTML={{ __html: clean(settings?.heroTitle || 'Questions<br />worth <em class="italic text-[#C48C5E]">asking.</em>') }} />
        <p className="text-[1.05rem] text-[#78716A] max-w-[540px] mx-auto mb-12 animate-fade-up delay-600" dangerouslySetInnerHTML={{ __html: clean(settings?.heroSubtitle || '믿음이 없어도 괜찮아요. 질문이 있다면, 여기서 시작하세요.') }} />
        <div className="w-[1px] h-[60px] bg-gradient-to-b from-[#C48C5E] to-transparent mx-auto animate-fade-up delay-800"></div>
      </section>

      {/* Opening Quote */}
      <div 
        className="max-w-[700px] mx-auto px-5 md:px-10 pt-6 pb-[3rem] md:pb-0"
        style={{
          paddingTop: settings?.quotePaddingTop || undefined,
          paddingBottom: settings?.quotePaddingBottom || undefined,
          textAlign: (settings?.quoteTextAlign as any) || 'center'
        }}
      >
        <blockquote className="font-handwriting text-[clamp(1.6rem,4vw,2.5rem)] leading-[1.4] text-[#2D2926] relative p-0 m-0">
          <span className="absolute top-6 md:top-10 -left-2 md:-left-6 text-[6rem] md:text-[8rem] leading-none text-[#C48C5E] opacity-20 font-serif">"</span>
          <span dangerouslySetInnerHTML={{ __html: clean(settings?.quote || "우리는 노래를 만드는 사람들입니다.<br />음악이 닿지 못하는 곳에 있는 무언가를<br />찾고 있기 때문에.") }} />
          <cite className="block mt-6 text-[0.95rem] md:text-[1rem] tracking-[0.15em] text-[#C48C5E] not-italic uppercase" dangerouslySetInnerHTML={{ __html: clean(settings?.quoteAuthor || "— ibigband") }} />
        </blockquote>
      </div>

      {/* Search */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-6 md:pb-8">
        <input 
          type="text" 
          placeholder="궁금한 것을 검색하세요  /  Search your question..." 
          value={searchQuery}
          onChange={handleSearch}
          className="w-full bg-white shadow-sm border border-[#2D2926]/10 rounded-[20px] md:rounded-full px-6 py-4 md:py-4 text-[#2D2926] font-sans text-[0.95rem] md:text-[1rem] outline-none transition-all duration-300 focus:border-[#C48C5E] focus:shadow-md placeholder:text-[#A19D98]"
        />
      </div>

      {/* Filter Pills */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-[2rem] md:pb-[3rem]">
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.2em] text-[#A19D98] uppercase mb-5">주제별로 보기</p>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[0.95rem] md:text-[1.05rem] font-bold transition-all duration-300 cursor-pointer shadow-sm
                ${activeFilter === cat.id 
                  ? 'bg-[#2D2926] text-white border-transparent transform -translate-y-[1px] shadow-md' 
                  : 'bg-white border-[1.5px] border-[#2D2926]/20 text-[#4a4845] hover:bg-[#F2EFE9] hover:border-[#2D2926]/40 hover:text-[#2D2926] font-semibold'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="text-[0.95rem] md:text-[1rem] text-[#78716A] text-center mt-6">질문(?)을 터치하시면 답글(!)을 보실 수 있습니다.</p>
      </div>

      {/* Q&A List */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-10 pb-[4rem] md:pb-[6rem]">
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
          if (!categoriesWithItems.has(cat.id)) return null;

          const catItems = filteredData.filter(item => item.category === cat.id);

          return (
            <div key={cat.id} className="mb-8">
              <div className="flex items-center gap-4 mt-14 mb-6 after:content-[''] after:flex-1 after:h-[1px] after:bg-[rgba(45,41,38,0.1)]">
                <span className="text-[1rem] md:text-[1.05rem] tracking-[0.2em] text-[#C48C5E] uppercase">{cat.label}</span>
              </div>

              {catItems.map(item => {
                const isOpen = !!openItems[item.id];
                return (
                  <div key={item.id} className="mb-3 md:mb-4 bg-white rounded-2xl md:rounded-[24px] border border-[#2D2926]/10 overflow-hidden group/item shadow-sm hover:shadow-md transition-all duration-300">
                    <button 
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left font-sans transition-colors duration-200 outline-none hover:bg-slate-50/50"
                    >
                      <div className="pr-4">
                        <div className={`font-bold text-[1.2rem] md:text-[1.3rem] leading-[1.3] transition-colors duration-300 ${isOpen ? 'text-[#C48C5E]' : 'text-[#2D2926] group-hover/item:text-[#C48C5E]'}`}>
                          {item.question}
                        </div>
                        <div className="text-[1rem] md:text-[1.05rem] tracking-[0.05em] text-[#78716A] font-medium mt-1.5 font-sans">
                          {item.questionEn}
                        </div>
                      </div>
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-[#C48C5E]/10 text-[#C48C5E]' : 'bg-[#2D2926]/5 text-[#78716A]'}`}>
                        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-5 md:px-6 pb-6 md:pb-8 pt-2 md:pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
                        <div>
                          <div 
                            className="font-handwriting text-[1.4rem] md:text-[1.6rem] text-[#2D2926] leading-[1.6] py-5 px-6 border-l-2 border-[#C48C5E] bg-[rgba(196,140,94,0.05)] rounded-r-sm mb-6"
                            dangerouslySetInnerHTML={{ __html: clean(item.shortAnswer || '') }}
                          />
                          <div
                            className="text-[1.05rem] md:text-[1.1rem] font-medium leading-[1.85] text-[#4a4845] prose-p:mb-4 prose-strong:text-[#2D2926] prose-strong:font-normal"
                            dangerouslySetInnerHTML={{ __html: clean(item.fullAnswer || '') }}
                          />
                        </div>
                        <div className="flex flex-col gap-4">
                          {item.media && item.media.length > 0 && (
                            <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
                          )}
                          {item.media?.map((m: any, i: number) => {
                            if (m.type === 'video') {
                              return (
                                <a key={i} href={m.link || '#'} target="_blank" rel="noopener noreferrer" className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] group block">
                                  <div className="relative aspect-video bg-[white] flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1810 0%, #FAF9F6 100%)' }}>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
                                      {m.coverTitle && <div className="font-serif text-[0.9rem] text-[#C48C5E] tracking-[0.1em]">{m.coverTitle}</div>}
                                      {m.coverSubtitle && <div className="font-serif text-[1.3rem] text-[#2D2926] italic">{m.coverSubtitle}</div>}
                                    </div>
                                    <div className="absolute w-12 h-12 rounded-full bg-[rgba(250,249,246,0.9)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 z-20">
                                      <Play className="w-4 h-4 fill-[#FAF9F6] text-[#FAF9F6] ml-1" />
                                    </div>
                                  </div>
                                  <div className="p-4 flex justify-between items-center bg-[#F2EFE9]">
                                    <span className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">{m.title}</span>
                                    <span className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98] tracking-[0.05em]">{m.subtitle}</span>
                                  </div>
                                </a>
                              );
                            }
                            
                            if (m.type === 'audio') {
                              return (
                                <a href={m.link || '#'} key={i} target={m.link?.startsWith('http') ? '_blank' : '_self'} className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-colors duration-200 hover:border-[#C48C5E]">
                                  <div className="w-10 h-10 rounded bg-[white] border border-[rgba(45,41,38,0.1)] flex items-center justify-center shrink-0">
                                     <Headphones className="w-4 h-4 text-[#C48C5E]" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">{m.title}</div>
                                    <div className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98]">{m.subtitle}</div>
                                  </div>
                                  <Play className="w-4 h-4 text-[#C48C5E]" />
                                </a>
                              );
                            }
                            
                            const Icon = m.type === 'podcast' ? Headphones : BookOpen;
                            return (
                              <a key={i} href={m.link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-2 border-b border-[rgba(45,41,38,0.1)] hover:text-[#C48C5E] transition-colors group">
                                <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">{m.title}</span>
                                <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">{m.subtitle}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {!loading && filteredData.length === 0 && (
          <div className="py-20 text-center text-[#78716A]">
             검색 결과가 없습니다.
          </div>
        )}
      </section>

      {/* Music Playlist */}
      {!loading && playlist.length > 0 && (
        <section className="bg-white py-[4rem] px-5 md:px-10">
          <div className="max-w-[900px] mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#2D2926]">함께 들으면 좋은 추천 음악</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlist.map((music: any) => (
                <div key={music.id} className="bg-[#FAF9F6] border border-[#2D2926]/10 p-4 flex items-center gap-4 rounded-xl hover:bg-[#F2EFE9] transition-colors shadow-sm">
                  {music.thumbnailUrl ? (
                    <img src={music.thumbnailUrl} alt={music.title} className="w-16 h-16 object-cover rounded shadow-sm border border-[#2D2926]/5" />
                  ) : (
                    <div className="w-16 h-16 bg-white border border-[#2D2926]/10 rounded flex items-center justify-center text-[#C48C5E]">
                      <Headphones size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2D2926] truncate">{music.title}</p>
                    <p className="text-sm text-[#78716A] truncate">{music.artist}</p>
                  </div>
                  {music.fileUrl && (
                    <a href={music.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 w-10 h-10 rounded-full bg-white border border-[rgba(45,41,38,0.1)] flex items-center justify-center text-[#C48C5E] shadow-sm hover:scale-105 transition-transform">
                      <Play className="w-4 h-4 ml-1" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <div className="border-t border-[rgba(45,41,38,0.1)] py-[4rem] md:py-[6rem] px-5 md:px-10 text-center max-w-[700px] mx-auto">
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.25em] text-[#C48C5E] uppercase mb-8">Next Step</p>
        <h2 className="font-handwriting text-[clamp(2.4rem,6vw,3.5rem)] leading-[1.2] mb-5 text-[#2D2926]">
          더 이야기하고<br />싶으신가요?
        </h2>
        <p className="text-[1.05rem] text-[#78716A] mb-12">
          질문이 더 있거나, 누군가와 직접 이야기하고 싶다면 편하게 연락하세요. 판단 없이 듣겠습니다.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#" className="px-8 py-3 bg-[#B87A4B] text-white rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all shadow hover:shadow-md hover:bg-[#a66a3d]">
            이야기 나누기
          </a>
          <Link href="/music" className="px-8 py-3 bg-transparent text-[#4a4845] border-[1.5px] border-[#2D2926]/20 rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all hover:border-[#2D2926]/60 hover:text-[#2D2926] hover:bg-black/5">
            음악 듣기
          </Link>
        </div>
      </div>
    </div>
  );
}
