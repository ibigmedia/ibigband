"use client";

import { useState, useMemo } from 'react';
import { X, Search, Trash2, FolderOpen, Calendar, Music, Clock, Tag } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface SavedSetlist {
  id: string;
  title: string;
  items: any[];
  createdAt?: any;
  updatedAt?: any;
  category?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setlists: SavedSetlist[];
  currentSetlistId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'sunday', label: '주일예배' },
  { id: 'wednesday', label: '수요예배' },
  { id: 'friday', label: '금요기도회' },
  { id: 'special', label: '특별집회' },
  { id: 'practice', label: '연습' },
  { id: 'other', label: '기타' },
];

export default function SetlistManagerModal({ isOpen, onClose, setlists, currentSetlistId, onLoad, onDelete, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = setlists;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q));
    }
    if (category !== 'all') {
      result = result.filter(s => (s.category || 'other') === category);
    }
    return result;
  }, [setlists, search, category]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 셋리스트를 삭제하시겠습니까?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'setlists', id));
      onDelete(id);
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    } finally {
      setDeleting(null);
    }
  };

  const handleLoad = (id: string) => {
    onLoad(id);
    onClose();
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <FolderOpen className="text-[#E6C79C]" /> 저장된 셋리스트
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onNew(); onClose(); }}
                className="px-4 py-2 bg-[#2D2926] text-white rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors"
              >
                + 새로 만들기
              </button>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="셋리스트 검색..."
              className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#2D2926]"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  category === c.id ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A] hover:bg-black/5'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#78716A] py-12">
              {setlists.length === 0 ? '저장된 셋리스트가 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          )}
          {filtered.map(sl => (
            <div
              key={sl.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all group cursor-pointer hover:shadow-sm ${
                sl.id === currentSetlistId
                  ? 'bg-[#E6C79C]/10 border-[#E6C79C]'
                  : 'bg-white border-black/5 hover:border-[#78716A]/30'
              }`}
              onClick={() => handleLoad(sl.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-[15px] text-[#2D2926] truncate">{sl.title || '제목 없음'}</h4>
                  {sl.id === currentSetlistId && (
                    <span className="text-[9px] font-bold bg-[#E6C79C] text-[#2D2926] px-2 py-0.5 rounded-full shrink-0">현재</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#78716A]">
                  <span className="flex items-center gap-1"><Music size={10} /> {sl.items?.length || 0}곡</span>
                  {sl.createdAt && <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(sl.createdAt)}</span>}
                  {sl.category && (
                    <span className="flex items-center gap-1"><Tag size={10} /> {CATEGORIES.find(c => c.id === sl.category)?.label || sl.category}</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(sl.id); }}
                disabled={deleting === sl.id}
                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 shrink-0 text-center text-xs text-[#78716A]">
          총 {setlists.length}개 셋리스트
        </div>
      </div>
    </div>
  );
}
