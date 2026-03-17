"use client";

import { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, Music, FileText, FileAudio } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface LibraryItem {
  id: string;
  type: 'sheet' | 'mr' | 'bgm' | 'transcript' | 'guide';
  title: string;
  duration: string;
  note: string;
  author?: string;
  hasAudio?: boolean;
  hasPdf?: boolean;
  fileUrl?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  source?: string;
  sourceId?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingSourceIds: Set<string>;
  onImport: (items: LibraryItem[]) => void;
}

interface FetchedItem {
  item: LibraryItem;
  alreadyExists: boolean;
}

export default function ImportModal({ isOpen, onClose, existingSourceIds, onImport }: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FetchedItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'sheets' | 'music'>('sheets');

  useEffect(() => {
    if (isOpen) {
      fetchAll();
    }
  }, [isOpen]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Sheets
      const sheetsSnap = await getDocs(query(collection(db, 'sheets'), orderBy('createdAt', 'desc')));
      const sheets: FetchedItem[] = sheetsSnap.docs.map(d => {
        const data = d.data();
        const sourceId = `db-sheet-${d.id}`;
        return {
          item: {
            id: sourceId,
            type: 'sheet' as const,
            title: data.title || '제목 없음',
            author: data.artist || '미상',
            duration: '',
            note: data.key ? `${data.key} Key` : '사이트 악보',
            hasAudio: !!data.audioUrl || !!data.youtubeUrl,
            hasPdf: !!data.pdfUrl || !!data.imageUrl,
            fileUrl: data.pdfUrl || data.imageUrl || '',
            audioUrl: data.audioUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            source: 'db',
            sourceId,
          },
          alreadyExists: existingSourceIds.has(sourceId),
        };
      });

      // Music
      const musicSnap = await getDocs(query(collection(db, 'music'), orderBy('createdAt', 'desc')));
      const musicItems: FetchedItem[] = [];
      musicSnap.docs.forEach(d => {
        const data = d.data();
        const tracks = data.tracks || [];
        // Only import individual tracks that have audio - skip album descriptions
        tracks.forEach((track: any, idx: number) => {
          const sourceId = `db-music-${d.id}-${idx}`;
          const trackAudioUrl = track.audioUrl || track.versions?.[0]?.audioUrl || '';
          // Skip tracks without audio
          if (!trackAudioUrl) return;
          musicItems.push({
            item: {
              id: sourceId,
              type: 'mr',
              title: track.versions?.[0]?.title || track.title || '제목 없음',
              author: data.artist || '',
              duration: track.duration || '',
              note: data.title || '',
              hasAudio: true,
              hasPdf: false,
              fileUrl: '',
              audioUrl: trackAudioUrl,
              youtubeUrl: '',
              source: 'db',
              sourceId,
            },
            alreadyExists: existingSourceIds.has(sourceId),
          });
        });
      });

      setItems(tab === 'sheets' ? sheets : musicItems);
      // store both
      (window as any).__importSheets = sheets;
      (window as any).__importMusic = musicItems;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sheets = (window as any).__importSheets || [];
    const music = (window as any).__importMusic || [];
    setItems(tab === 'sheets' ? sheets : music);
    setSelected(new Set());
  }, [tab]);

  const filteredItems = search.trim()
    ? items.filter(i => i.item.title.toLowerCase().includes(search.toLowerCase()) || (i.item.author || '').toLowerCase().includes(search.toLowerCase()))
    : items;

  const availableItems = filteredItems.filter(i => !i.alreadyExists);
  const toggleItem = (sourceId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === availableItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableItems.map(i => i.item.sourceId!)));
    }
  };

  const handleImport = () => {
    const toImport = items
      .filter(i => !i.alreadyExists && selected.has(i.item.sourceId!))
      .map(i => i.item);
    onImport(toImport);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl">사이트 라이브러리에서 가져오기</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab('sheets')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'sheets' ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A] hover:bg-black/5'}`}>
              <FileText size={14} className="inline mr-1.5 -mt-0.5" /> 악보
            </button>
            <button onClick={() => setTab('music')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'music' ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A] hover:bg-black/5'}`}>
              <Music size={14} className="inline mr-1.5 -mt-0.5" /> 음악/MR
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={16} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="제목 또는 아티스트 검색..."
              className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#2D2926]"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-[#78716A]" /></div>
          ) : (
            <>
              {filteredItems.length === 0 && <p className="text-center text-sm text-[#78716A] py-12">항목이 없습니다.</p>}
              <div className="space-y-2">
                {filteredItems.map(({ item, alreadyExists }) => (
                  <div
                    key={item.sourceId}
                    onClick={() => !alreadyExists && toggleItem(item.sourceId!)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      alreadyExists
                        ? 'bg-black/5 border-black/5 opacity-50 cursor-not-allowed'
                        : selected.has(item.sourceId!)
                        ? 'bg-[#E6C79C]/10 border-[#E6C79C] cursor-pointer'
                        : 'bg-white border-black/5 hover:border-[#78716A]/30 cursor-pointer'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      alreadyExists ? 'bg-black/10 border-black/10' :
                      selected.has(item.sourceId!) ? 'bg-[#2D2926] border-[#2D2926]' : 'border-black/20'
                    }`}>
                      {(alreadyExists || selected.has(item.sourceId!)) && <Check size={12} className="text-white" />}
                    </div>

                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 ${item.type === 'sheet' ? 'bg-[#2D2926]/10' : 'bg-[#E6C79C]/20'}`}>
                      {item.type === 'sheet' ? <FileText size={16} className="text-[#2D2926]" /> : <FileAudio size={16} className="text-[#8C6B1C]" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#2D2926] truncate">{item.title}</p>
                      <p className="text-xs text-[#78716A] truncate">{item.author} {item.note ? `· ${item.note}` : ''}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-1 shrink-0">
                      {item.hasPdf && <span className="text-[9px] font-bold bg-[#2D2926]/10 px-1.5 py-0.5 rounded">PDF</span>}
                      {item.hasAudio && <span className="text-[9px] font-bold bg-[#E6C79C]/30 px-1.5 py-0.5 rounded">MP3</span>}
                      {alreadyExists && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">추가됨</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 shrink-0 flex items-center justify-between gap-4">
          <button onClick={selectAll} className="text-sm font-bold text-[#78716A] hover:text-[#2D2926] transition-colors">
            {selected.size === availableItems.length && availableItems.length > 0 ? '선택 해제' : '전체 선택'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#78716A]">{selected.size}개 선택</span>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="px-6 py-2.5 bg-[#2D2926] text-white rounded-xl font-bold text-sm hover:bg-[#78716A] transition-colors disabled:opacity-30"
            >
              가져오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
