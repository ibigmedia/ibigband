"use client";

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Edit3, Check, X, Archive, Music, FileText, Mic, Type, Loader2, Tag, CheckSquare, Square } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
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

const MUSICAL_KEYS = ['', 'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
const LANGUAGES = [
  { id: '', label: '한글' },
  { id: 'EN', label: 'EN' },
  { id: 'SP', label: 'SP' },
];

interface ArchiveItem extends LibraryItem {
  archiveId: string;
  category: string;
  musicalKey?: string;
  lang?: string;
  tags?: string[];
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
  const [filterKey, setFilterKey] = useState('all');
  const [filterLang, setFilterLang] = useState('all');
  const [filterTag, setFilterTag] = useState('');

  // 사용자 정의 태그 입력
  const [tagInputId, setTagInputId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');

  // 일괄 선택/수정 모드
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'key' | 'lang' | 'category' | 'tag' | null>(null);
  const [batchValue, setBatchValue] = useState('');

  // 실시간 리스너
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

  // 전체 사용자 정의 태그 목록 (아카이브 내 모든 아이템에서 수집)
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(i => (i.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [items]);

  // 필터링 (검색에 태그 포함)
  const filtered = useMemo(() => {
    let result = items;
    if (category !== 'all') result = result.filter(i => i.category === category);
    if (filterKey !== 'all') result = result.filter(i => (i.musicalKey || '') === filterKey);
    if (filterLang !== 'all') result = result.filter(i => (i.lang || '') === filterLang);
    if (filterTag) result = result.filter(i => (i.tags || []).includes(filterTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q) ||
        (i.note || '').toLowerCase().includes(q) ||
        (i.musicalKey || '').toLowerCase().includes(q) ||
        (i.lang || '').toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, search, category, filterKey, filterLang, filterTag]);

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
    try { await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { category: newCat }); } catch (e) { console.error(e); }
  };

  const handleChangeKey = async (archiveId: string, newKey: string) => {
    try { await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { musicalKey: newKey }); } catch (e) { console.error(e); }
  };

  const handleChangeLang = async (archiveId: string, newLang: string) => {
    try { await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { lang: newLang }); } catch (e) { console.error(e); }
  };

  // 사용자 정의 태그 추가
  const handleAddTag = async (archiveId: string) => {
    const tag = tagInputValue.trim();
    if (!tag) return;
    const item = items.find(i => i.archiveId === archiveId);
    if (!item) return;
    const current = item.tags || [];
    if (current.includes(tag)) { setTagInputId(null); setTagInputValue(''); return; }
    try {
      await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { tags: [...current, tag] });
    } catch (e) { console.error(e); }
    setTagInputId(null);
    setTagInputValue('');
  };

  // 사용자 정의 태그 삭제
  const handleRemoveTag = async (archiveId: string, tag: string) => {
    const item = items.find(i => i.archiveId === archiveId);
    if (!item) return;
    try {
      await updateDoc(doc(db, 'users', userId, 'archive', archiveId), { tags: (item.tags || []).filter(t => t !== tag) });
    } catch (e) { console.error(e); }
  };

  // 일괄 수정 실행
  const executeBatchAction = async () => {
    if (selectedIds.size === 0 || !batchAction) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      const ref = doc(db, 'users', userId, 'archive', id);
      if (batchAction === 'key') batch.update(ref, { musicalKey: batchValue });
      else if (batchAction === 'lang') batch.update(ref, { lang: batchValue });
      else if (batchAction === 'category') batch.update(ref, { category: batchValue });
      else if (batchAction === 'tag') {
        const item = items.find(i => i.archiveId === id);
        const tags = item?.tags || [];
        if (batchValue && !tags.includes(batchValue)) batch.update(ref, { tags: [...tags, batchValue] });
      }
    });
    try {
      await batch.commit();
      alert(`${selectedIds.size}개 항목이 수정되었습니다.`);
    } catch (e) { console.error(e); alert('일괄 수정 실패'); }
    setBatchAction(null);
    setBatchValue('');
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(i => i.archiveId)));
  };

  const handleAddToLibrary = (item: ArchiveItem) => {
    const libItem: LibraryItem = {
      id: item.sourceId || `archive-${item.archiveId}`,
      type: item.type, title: item.title, author: item.author,
      duration: item.duration, note: item.note, hasAudio: item.hasAudio,
      hasPdf: item.hasPdf, fileUrl: item.fileUrl, audioUrl: item.audioUrl,
      youtubeUrl: item.youtubeUrl, source: item.source, sourceId: item.sourceId,
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
          <div className="flex items-center gap-2">
            <button onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); setBatchAction(null); }}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${batchMode ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A] hover:bg-black/5'}`}>
              {batchMode ? '선택 해제' : '일괄 수정'}
            </button>
            <span className="text-xs text-[#78716A]">{items.length}개</span>
          </div>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="제목, 아티스트, 태그 검색..."
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
        <div className="flex gap-2 mt-2 flex-wrap">
          <select value={filterKey} onChange={e => setFilterKey(e.target.value)}
            className="text-[10px] font-bold bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2D2926]">
            <option value="all">키 전체</option>
            <option value="">미지정</option>
            {MUSICAL_KEYS.filter(k => k).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
            className="text-[10px] font-bold bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2D2926]">
            <option value="all">언어 전체</option>
            {LANGUAGES.map(l => <option key={l.id || 'kr'} value={l.id}>{l.label}</option>)}
          </select>
          {allTags.length > 0 && (
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
              className="text-[10px] font-bold bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-1 focus:outline-none focus:border-[#2D2926]">
              <option value="">태그 전체</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {(filterKey !== 'all' || filterLang !== 'all' || filterTag) && (
            <button onClick={() => { setFilterKey('all'); setFilterLang('all'); setFilterTag(''); }}
              className="text-[10px] text-red-400 hover:text-red-600 font-bold">초기화</button>
          )}
        </div>
      </div>

      {/* 일괄 수정 액션 바 */}
      {batchMode && selectedIds.size > 0 && (
        <div className="p-3 bg-[#2D2926] text-white shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{selectedIds.size}개 선택됨</span>
            <button onClick={toggleSelectAll} className="text-[10px] underline">{selectedIds.size === filtered.length ? '전체 해제' : '전체 선택'}</button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => { setBatchAction('key'); setBatchValue(''); }} className={`px-2 py-1 rounded text-[10px] font-bold ${batchAction === 'key' ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'}`}>키 변경</button>
            <button onClick={() => { setBatchAction('lang'); setBatchValue(''); }} className={`px-2 py-1 rounded text-[10px] font-bold ${batchAction === 'lang' ? 'bg-purple-500' : 'bg-white/20 hover:bg-white/30'}`}>언어 변경</button>
            <button onClick={() => { setBatchAction('category'); setBatchValue(''); }} className={`px-2 py-1 rounded text-[10px] font-bold ${batchAction === 'category' ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/30'}`}>카테고리 변경</button>
            <button onClick={() => { setBatchAction('tag'); setBatchValue(''); }} className={`px-2 py-1 rounded text-[10px] font-bold ${batchAction === 'tag' ? 'bg-green-500' : 'bg-white/20 hover:bg-white/30'}`}>태그 추가</button>
          </div>
          {batchAction && (
            <div className="flex items-center gap-2">
              {batchAction === 'key' && (
                <select value={batchValue} onChange={e => setBatchValue(e.target.value)} className="text-[11px] font-bold bg-white text-[#2D2926] rounded px-2 py-1">
                  <option value="">키 선택</option>
                  {MUSICAL_KEYS.filter(k => k).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              )}
              {batchAction === 'lang' && (
                <select value={batchValue} onChange={e => setBatchValue(e.target.value)} className="text-[11px] font-bold bg-white text-[#2D2926] rounded px-2 py-1">
                  {LANGUAGES.map(l => <option key={l.id || 'kr'} value={l.id}>{l.label}</option>)}
                </select>
              )}
              {batchAction === 'category' && (
                <select value={batchValue} onChange={e => setBatchValue(e.target.value)} className="text-[11px] font-bold bg-white text-[#2D2926] rounded px-2 py-1">
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              )}
              {batchAction === 'tag' && (
                <input type="text" value={batchValue} onChange={e => setBatchValue(e.target.value)} placeholder="태그 입력..."
                  className="text-[11px] font-bold bg-white text-[#2D2926] rounded px-2 py-1 focus:outline-none" />
              )}
              <button onClick={executeBatchAction} disabled={!batchValue && batchAction !== 'lang'}
                className="px-3 py-1 bg-[#E6C79C] text-[#2D2926] rounded text-[10px] font-bold hover:bg-[#d4b589] disabled:opacity-40">
                적용
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-[#78716A]" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#78716A]">
            <Archive size={28} className="mb-2 opacity-30" />
            <p className="text-sm font-bold">{search || category !== 'all' || filterTag ? '검색 결과 없음' : '아카이브가 비어있습니다'}</p>
            <p className="text-[10px] mt-1">파일을 가져오면 자동으로 저장됩니다</p>
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.archiveId} className={`bg-[#FAF9F6] border rounded-xl p-3 transition-all group ${
              batchMode && selectedIds.has(item.archiveId) ? 'border-[#E6C79C] bg-[#E6C79C]/10' : 'border-black/5 hover:border-[#E6C79C]'
            }`}>
              <div className="flex items-start gap-2.5">
                {/* 일괄 모드: 체크박스 */}
                {batchMode && (
                  <button onClick={() => toggleSelect(item.archiveId)} className="mt-1 shrink-0">
                    {selectedIds.has(item.archiveId)
                      ? <CheckSquare size={16} className="text-[#E6C79C]" />
                      : <Square size={16} className="text-[#78716A]" />}
                  </button>
                )}
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
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {item.author && <span className="text-[10px] text-[#78716A] truncate">{item.author}</span>}
                    <select value={item.category} onChange={e => handleChangeCategory(item.archiveId, e.target.value)}
                      className="text-[9px] font-bold bg-[#E6C79C]/20 text-[#8C6B1C] px-1.5 py-0.5 rounded border-none focus:outline-none cursor-pointer">
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <select value={item.musicalKey || ''} onChange={e => handleChangeKey(item.archiveId, e.target.value)}
                      className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border-none focus:outline-none cursor-pointer">
                      <option value="">키</option>
                      {MUSICAL_KEYS.filter(k => k).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <select value={item.lang || ''} onChange={e => handleChangeLang(item.archiveId, e.target.value)}
                      className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border-none focus:outline-none cursor-pointer">
                      {LANGUAGES.map(l => <option key={l.id || 'kr'} value={l.id}>{l.label}</option>)}
                    </select>
                  </div>
                  {/* 태그 표시 + 추가 */}
                  <div className="flex gap-1 mt-1 flex-wrap items-center">
                    {item.musicalKey && <span className="text-[8px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{item.musicalKey}</span>}
                    {item.lang && <span className="text-[8px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{item.lang}</span>}
                    {(item.tags || []).map(tag => (
                      <span key={tag} className="text-[8px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        {tag}
                        <button onClick={() => handleRemoveTag(item.archiveId, tag)} className="hover:text-red-500 ml-0.5"><X size={8} /></button>
                      </span>
                    ))}
                    {item.hasPdf && <span className="text-[8px] font-bold bg-[#2D2926]/10 px-1.5 py-0.5 rounded">PDF</span>}
                    {item.hasAudio && <span className="text-[8px] font-bold bg-[#E6C79C]/30 px-1.5 py-0.5 rounded">MP3</span>}
                    {tagInputId === item.archiveId ? (
                      <div className="flex items-center gap-0.5">
                        <input type="text" value={tagInputValue} onChange={e => setTagInputValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag(item.archiveId)}
                          placeholder="태그 입력" autoFocus
                          className="text-[9px] bg-white border border-green-300 rounded px-1.5 py-0.5 w-16 focus:outline-none" />
                        <button onClick={() => handleAddTag(item.archiveId)} className="text-green-600"><Check size={10} /></button>
                        <button onClick={() => { setTagInputId(null); setTagInputValue(''); }} className="text-[#78716A]"><X size={10} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setTagInputId(item.archiveId); setTagInputValue(''); }}
                        className="text-[8px] text-[#78716A] hover:text-green-600 flex items-center gap-0.5 transition-colors" title="태그 추가">
                        <Tag size={8} />+
                      </button>
                    )}
                  </div>
                </div>
                {!batchMode && (
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
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { MUSICAL_KEYS, LANGUAGES };

export async function saveToArchive(
  userId: string,
  items: LibraryItem[],
  existingSourceIds?: Set<string>,
  opts?: { musicalKey?: string; lang?: string; tags?: string[] }
): Promise<number> {
  let saved = 0;
  const batch = writeBatch(db);
  for (const item of items) {
    if (existingSourceIds && item.sourceId && existingSourceIds.has(item.sourceId)) continue;
    const docRef = doc(collection(db, 'users', userId, 'archive'));
    batch.set(docRef, {
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
      musicalKey: opts?.musicalKey || '',
      lang: opts?.lang || '',
      tags: opts?.tags || [],
      createdAt: serverTimestamp(),
    });
    saved++;
  }
  if (saved > 0) await batch.commit();
  return saved;
}
