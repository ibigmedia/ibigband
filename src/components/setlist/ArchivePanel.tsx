"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Edit3, Check, X, Archive, FolderOpen, Music, FileText, Mic, Type, Play, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LibraryItem } from './ImportModal';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '📁' },
  { id: '악보', label: '악보', icon: '🎼' },
  { id: 'MR/음원', label: 'MR/음원', icon: '🎵' },
  { id: '대본', label: '대본/원고', icon: '📝' },
  { id: '가이드', label: '가이드', icon: '🎤' },
  { id: '기타', label: '기타', icon: '📂' },
];

function getDefaultCategory(type: string): string {
  switch (type) {
    case 'sheet': return '악보';
    case 'mr': case 'bgm': return 'MR/음원';
    case 'transcript': return '대본';
    case 'guide': return '가이드';
    default: return '기타';
  }
}

interface ArchiveItem extends LibraryItem {
  archiveId: string;
  category: string;
  createdAt?: any;
}

interface Props {
  userId: string;
  onAddToLibrary: (item: LibraryItem) => void;
  existingLibraryIds: Set<string>;
}

export default function ArchivePanel({ userId, onAddToLibrary, existingLibraryIds }: Props) {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Real-time listener
  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'users', userId, 'archive'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        ...d.data(),
        archiveId: d.id,
        id: d.data().sourceId || d.id,
      } as ArchiveItem));
      setItems(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [userId]);

  const filtered = useMemo(() => {
    let result = items;
    if (category !== 'all') result = result.filter(i => i.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q) ||
        (i.note || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, search, category]);

  const handleRename = async (archiveId: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { title: editTitle.trim() });
    } catch (e) { console.error(e); }
    setEditingId(null);
  };

  const handleDelete = async (archiveId: string) => {
    if (!confirm('아카이브에서 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'archive', archiveId));
    } catch (e) { console.error(e); alert('삭제 실패'); }
  };

  const handleChangeCategory = async (archiveId: string, newCat: string) => {
    try {
      await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { category: newCat });
    } catch (e) { console.error(e); }
  };

  const handleAddToLibrary = (item: ArchiveItem) => {
    const libItem: LibraryItem = {
      id: item.sourceId || `archive-${item.archiveId}`,
      type: item.type,
      title: item.title,
      author: item.author,
      duration: item.duration,
      note: item.note,
      hasAudio: item.hasAudio,
      hasPdf: item.hasPdf,
      fileUrl: item.fileUrl,
      audioUrl: item.audioUrl,
      youtubeUrl: item.youtubeUrl,
      source: item.source,
      sourceId: item.sourceId,
    };
    onAddToLibrary(libItem);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sheet': return <FileText size={12} />;
      case 'mr': case 'bgm': return <Music size={12} />;
      case 'transcript': return <Type size={12} />;
      case 'guide': return <Mic size={12} />;
      default: return <FileText size={12} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-black/5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Archive className="text-[#E6C79C]" size={18} /> 아카이브
          </h3>
          <span className="text-xs text-[#78716A]">{items.length}개</span>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="아카이브 검색..."
            className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#2D2926]" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                category === c.id ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A] hover:bg-black/5'
              }`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-[#78716A]" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#78716A]">
            <Archive size={28} className="mb-2 opacity-30" />
            <p className="text-sm font-bold">{search || category !== 'all' ? '검색 결과 없음' : '아카이브가 비어있습니다'}</p>
            <p className="text-[10px] mt-1">파일을 가져오면 자동으로 저장됩니다</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.archiveId} className="bg-[#FAF9F6] border border-black/5 rounded-xl p-3 hover:border-[#E6C79C] transition-all group">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1.5 rounded-lg bg-[#2D2926]/10 shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === item.archiveId ? (
                    <div className="flex items-center gap-1">
                      <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRename(item.archiveId)}
                        className="flex-1 text-[13px] font-bold bg-white border border-[#E6C79C] rounded-lg px-2 py-1 focus:outline-none" autoFocus />
                      <button onClick={() => handleRename(item.archiveId)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-[#78716A] hover:bg-black/5 rounded"><X size={14} /></button>
                    </div>
                  ) : (
                    <p className="font-bold text-[13px] text-[#2D2926] truncate">{item.title}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.author && <span className="text-[10px] text-[#78716A] truncate">{item.author}</span>}
                    <select value={item.category} onChange={e => handleChangeCategory(item.archiveId, e.target.value)}
                      className="text-[9px] font-bold bg-[#E6C79C]/20 text-[#8C6B1C] px-1.5 py-0.5 rounded border-none focus:outline-none cursor-pointer">
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {item.hasPdf && <span className="text-[8px] font-bold bg-[#2D2926]/10 px-1.5 py-0.5 rounded">PDF</span>}
                    {item.hasAudio && <span className="text-[8px] font-bold bg-[#E6C79C]/30 px-1.5 py-0.5 rounded">MP3</span>}
                    {item.source && <span className="text-[8px] text-[#78716A]">{item.source === 'db' ? '사이트' : item.source === 'gdrive' ? '드라이브' : item.source === 'paste' ? '붙여넣기' : item.source === 'upload' ? '업로드' : item.source}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => handleAddToLibrary(item)}
                    disabled={existingLibraryIds.has(item.sourceId || '')}
                    className="p-2 bg-[#E6C79C]/20 text-[#8C6B1C] hover:bg-[#E6C79C] hover:text-[#2D2926] rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={existingLibraryIds.has(item.sourceId || '') ? '이미 추가됨' : '미디어풀에 추가'}>
                    <Plus size={16} />
                  </button>
                  <button onClick={() => { setEditingId(item.archiveId); setEditTitle(item.title); }}
                    className="p-1.5 text-[#78716A] hover:bg-black/5 rounded-lg transition-colors" title="이름 변경">
                    <Edit3 size={12} />
                  </button>
                  <button onClick={() => handleDelete(item.archiveId)}
                    className="p-1.5 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="삭제">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Utility function to save items to archive (used by the main page)
export async function saveToArchive(userId: string, items: LibraryItem[], existingSourceIds?: Set<string>): Promise<number> {
  let saved = 0;
  const batch = writeBatch(db);
  for (const item of items) {
    if (existingSourceIds && item.sourceId && existingSourceIds.has(item.sourceId)) continue;
    const ref = doc(collection(db, 'users', userId, 'archive'));
    batch.set(ref, {
      type: item.type,
      title: item.title,
      author: item.author || '',
      duration: item.duration || '',
      note: item.note || '',
      hasAudio: item.hasAudio || false,
      hasPdf: item.hasPdf || false,
      fileUrl: item.fileUrl || '',
      audioUrl: item.audioUrl || '',
      youtubeUrl: item.youtubeUrl || '',
      source: item.source || 'unknown',
      sourceId: item.sourceId || item.id,
      category: getDefaultCategory(item.type),
      createdAt: serverTimestamp(),
    });
    saved++;
  }
  if (saved > 0) await batch.commit();
  return saved;
}
