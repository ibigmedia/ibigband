"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, setDoc } from 'firebase/firestore';
import { Edit2, Trash2, Plus, Sparkles, X, LayoutDashboard, Search, GripVertical, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export interface SeekerMedia {
  type: 'video' | 'audio' | 'book' | 'podcast';
  title: string;
  subtitle: string;
  link: string;
  coverTitle?: string;
  coverSubtitle?: string;
}

export interface SeekerItem {
  id: string;
  order: number;
  category: string;
  keywords: string;
  question: string;
  questionEn: string;
  shortAnswer: string;
  fullAnswer: string;
  media: SeekerMedia[];
}

const CATEGORIES = [
  { id: 'existence', label: '존재와 우주' },
  { id: 'history', label: '역사와 문서' },
  { id: 'science', label: '과학과 신앙' },
  { id: 'pain', label: '고통과 공의' },
  { id: 'church', label: '교회와 종교' },
  { id: 'personal', label: '개인과 신앙' }
];

export default function AdminSeekersPage() {
  const [items, setItems] = useState<SeekerItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingItem, setEditingItem] = useState<SeekerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [settings, setSettings] = useState<any>({
    heroLabel: 'Seekers / 구도자',
    heroTitle: 'Questions<br />worth <em className="italic text-[#C48C5E]">asking.</em>',
    heroSubtitle: '믿음이 없어도 괜찮아요. 질문이 있다면, 여기서 시작하세요.',
    heroPaddingTop: '9rem',
    heroPaddingBottom: '5rem',
    heroTextAlign: 'center',
    quote: '"우리는 노래를 만드는 사람들입니다.<br />음악이 닿지 못하는 곳에 있는 무언가를<br />찾고 있기 때문에."',
    quoteAuthor: '— ibigband',
    quotePaddingTop: '1.5rem',
    quotePaddingBottom: '4rem',
    quoteTextAlign: 'center',
    playlists: []
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [musicList, setMusicList] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'seekers'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const result: SeekerItem[] = [];
      snapshot.forEach(doc => {
        const docData = doc.data();
        result.push({ id: doc.id, ...docData, category: docData.category || 'existence' } as SeekerItem);
      });
      setItems(result);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
      setLoading(false);
    });

    const qSettings = doc(db, 'pages', 'seekers');
    const unsubSettings = onSnapshot(qSettings, (docSnap) => {
      if (docSnap.exists()) {
         setSettings((prev: any) => ({ ...prev, ...docSnap.data() }));
      }
      setSettingsLoading(false);
    }, (error) => {
      console.error("Firestore Settings Error:", error);
      setSettingsLoading(false);
    });

    getDocs(collection(db, 'music')).then(snap => {
       setMusicList(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }).catch(console.error);

    return () => {
       unsubscribe();
       unsubSettings();
    };
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'pages', 'seekers'), settings, { merge: true });
      alert('설정이 저장되었습니다.');
    } catch (e) {
      console.error('Error saving settings:', e);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    setEditingItem({
      id: '',
      order: items.length > 0 ? Math.max(...items.map(i => i.order || 0)) + 1 : 1,
      category: 'existence',
      keywords: '',
      question: '',
      questionEn: '',
      shortAnswer: '',
      fullAnswer: '',
      media: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: SeekerItem) => {
    setEditingItem({ ...item, media: item.media || [] });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'seekers', id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    
    try {
      const dataToSave = {
        order: editingItem.order || 0,
        category: editingItem.category,
        keywords: editingItem.keywords,
        question: editingItem.question,
        questionEn: editingItem.questionEn,
        shortAnswer: editingItem.shortAnswer,
        fullAnswer: editingItem.fullAnswer,
        media: editingItem.media || [],
        updatedAt: serverTimestamp()
      };

      if (editingItem.id) {
        await updateDoc(doc(db, 'seekers', editingItem.id), dataToSave);
      } else {
        await addDoc(collection(db, 'seekers'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      alert('AI에게 생성할 주제(예: 하나님 존재, 고통의 문제 등)를 입력해주세요.');
      return;
    }
    
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/seekers/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      setEditingItem(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          category: data.category || prev.category,
          question: data.question,
          questionEn: data.questionEn,
          keywords: data.keywords,
          shortAnswer: data.shortAnswer,
          fullAnswer: data.fullAnswer,
          media: data.media || []
        };
      });
    } catch (error) {
      console.error(error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  };

  const addMediaRow = () => {
    if (!editingItem) return;
    setEditingItem({
      ...editingItem,
      media: [...editingItem.media, { type: 'video', title: '', subtitle: '', link: '', coverTitle: '', coverSubtitle: '' }]
    });
  };

  const updateMedia = (index: number, field: keyof SeekerMedia, value: string) => {
    if (!editingItem) return;
    const newMedia = [...editingItem.media];
    newMedia[index] = { ...newMedia[index], [field]: value };
    setEditingItem({ ...editingItem, media: newMedia });
  };

  const removeMedia = (index: number) => {
    if (!editingItem) return;
    const newMedia = editingItem.media.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, media: newMedia });
  };

  return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#2D2926] p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#2D2926]/10">
            <div>
              <h1 className="text-2xl font-bold">Seekers (구도자) 관리</h1>
              <p className="text-sm text-[#78716A] mt-1">FAQ 항목, 답변, 추천 미디어(음악, 영상 등)를 편집하세요.</p>
            </div>
            {activeTab === 'list' && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-[#2D2926] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2D2926]/80 transition-colors"
              >
                <Plus size={18} />
                새 질문 추가
              </button>
            )}
          </div>

          <div className="flex gap-4 border-b border-[rgba(45,41,38,0.1)] mb-6 px-4">
            <button 
              onClick={() => setActiveTab('list')} 
              className={`pb-3 px-2 transition-colors ${activeTab === 'list' ? 'border-b-2 border-[#C48C5E] font-bold text-[#2D2926]' : 'text-[#78716A] hover:text-[#2D2926]'}`}
            >
              질문 목록
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`pb-3 px-2 transition-colors ${activeTab === 'settings' ? 'border-b-2 border-[#C48C5E] font-bold text-[#2D2926]' : 'text-[#78716A] hover:text-[#2D2926]'}`}
            >
              페이지 설정 (히어로 & 추가 콘텐츠)
            </button>
          </div>

          {activeTab === 'list' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-[#2D2926]/10 overflow-hidden">
              {loading ? (
              <div className="p-8 text-center text-[#78716A]">로딩 중...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-[#78716A]">등록된 질문이 없습니다.</div>
            ) : (
              <div className="divide-y divide-[rgba(45,41,38,0.1)]">
                {items.map(item => (
                  <div key={item.id} className="p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-[#F2EFE9] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-[#2D2926]/5 text-[#78716A] text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                        </span>
                        <h3 className="font-bold text-lg text-[#2D2926] truncate">{item.question}</h3>
                      </div>
                      <p className="text-sm text-[#78716A] truncate">{item.questionEn}</p>
                      <p className="text-sm text-[#4a4845] mt-2 line-clamp-1">{item.shortAnswer}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-[#78716A] hover:bg-white rounded-lg hover:text-[#C48C5E] transition-colors border border-transparent hover:border-[rgba(45,41,38,0.1)]"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-[#78716A] hover:bg-white rounded-lg hover:text-red-500 transition-colors border border-transparent hover:border-[rgba(45,41,38,0.1)]"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#2D2926]/10 p-6 space-y-8">
            {settingsLoading ? (
               <div className="text-center text-[#78716A] p-8">로딩 중...</div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold mb-4">히어로 섹션 설정</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#2D2926] mb-1.5">작은 제목 (Label)</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                        value={settings.heroLabel || ''}
                        onChange={e => setSettings({ ...settings, heroLabel: e.target.value })}
                        placeholder="Seekers / 구도자"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2D2926] mb-1.5">메인 타이틀 (Title) * HTML 태그(br, em 등) 사용 가능</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                        value={settings.heroTitle || ''}
                        onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                        placeholder="Questions<br />worth <em className='italic text-[#C48C5E]'>asking.</em>"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2D2926] mb-1.5">서브 타이틀 (Subtitle)</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                        value={settings.heroSubtitle || ''}
                        onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                        placeholder="믿음이 없어도 괜찮아요. 질문이 있다면, 여기서 시작하세요."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[rgba(45,41,38,0.1)]">
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">상단 여백 (Padding Top)</label>
                        <input
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.heroPaddingTop || ''}
                          onChange={e => setSettings({ ...settings, heroPaddingTop: e.target.value })}
                          placeholder="예: 9rem, 144px"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">하단 여백 (Padding Bottom)</label>
                        <input
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.heroPaddingBottom || ''}
                          onChange={e => setSettings({ ...settings, heroPaddingBottom: e.target.value })}
                          placeholder="예: 5rem, 80px"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">글 정렬 (Text Align)</label>
                        <select
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.heroTextAlign || 'center'}
                          onChange={e => setSettings({ ...settings, heroTextAlign: e.target.value })}
                        >
                          <option value="left">왼쪽 정렬</option>
                          <option value="center">가운데 정렬</option>
                          <option value="right">오른쪽 정렬</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">인용구 (Quotes) 설정</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#2D2926] mb-1.5">인용구 내용 * HTML 태그(br 등) 사용 가능</label>
                      <textarea
                        className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm h-24"
                        value={settings.quote || ''}
                        onChange={e => setSettings({ ...settings, quote: e.target.value })}
                        placeholder={"\"우리는 노래를 만드는 사람들입니다.<br />음악이 닿지 못하는 곳에 있는 무언가를<br />찾고 있기 때문에.\""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2D2926] mb-1.5">글쓴이</label>
                      <input
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                        value={settings.quoteAuthor || ''}
                        onChange={e => setSettings({ ...settings, quoteAuthor: e.target.value })}
                        placeholder="— ibigband"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[rgba(45,41,38,0.1)]">
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">상단 여백 (Padding Top)</label>
                        <input
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.quotePaddingTop || ''}
                          onChange={e => setSettings({ ...settings, quotePaddingTop: e.target.value })}
                          placeholder="예: 1.5rem, 24px"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">하단 여백 (Padding Bottom)</label>
                        <input
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.quotePaddingBottom || ''}
                          onChange={e => setSettings({ ...settings, quotePaddingBottom: e.target.value })}
                          placeholder="예: 4rem, 64px"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#2D2926] mb-1.5">글 정렬 (Text Align)</label>
                        <select
                          className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] text-sm"
                          value={settings.quoteTextAlign || 'center'}
                          onChange={e => setSettings({ ...settings, quoteTextAlign: e.target.value })}
                        >
                          <option value="left">왼쪽 정렬</option>
                          <option value="center">가운데 정렬</option>
                          <option value="right">오른쪽 정렬</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">배경 음악 플레이리스트 연동</h2>
                    <p className="text-sm text-[#78716A]">음악 관리 메뉴에 등록된 음원 중 표시할 항목을 선택하세요.</p>
                  </div>
                  
                  {musicList.length === 0 ? (
                    <div className="text-sm text-[#78716A] p-4 bg-[#FAF9F6] rounded-xl border border-[rgba(45,41,38,0.1)]">
                      등록된 음악이 없습니다. &apos;음악 관리&apos; 메뉴에서 먼저 음원을 등록해주세요.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {musicList.map(music => (
                        <div 
                          key={music.id} 
                          onClick={() => {
                            const isSelected = (settings.playlists || []).includes(music.id);
                            setSettings({
                              ...settings,
                              playlists: isSelected 
                                ? (settings.playlists || []).filter((id: string) => id !== music.id)
                                : [...(settings.playlists || []), music.id]
                            });
                          }}
                          className={`p-4 rounded-xl cursor-pointer border transition-colors ${(settings.playlists || []).includes(music.id) ? 'bg-[#F2EFE9] border-[#C48C5E]' : 'bg-[#FAF9F6] border-[rgba(45,41,38,0.1)] hover:border-[#C48C5E]/50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${(settings.playlists || []).includes(music.id) ? 'bg-[#C48C5E] border-[#C48C5E] text-white' : 'bg-white border-[#2D2926]/20'}`}>
                              {(settings.playlists || []).includes(music.id) && <Check size={14} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{music.title}</p>
                              {music.artist && <p className="text-xs text-[#78716A] truncate">{music.artist}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-[rgba(45,41,38,0.1)] flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#2D2926] text-white hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSaving ? '저장 중...' : '설정 저장'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

        {/* Edit Modal */}
        {isModalOpen && editingItem && (
          <div className="fixed inset-0 bg-[#2D2926]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#FAF9F6] w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-[rgba(45,41,38,0.1)] shrink-0">
                <h2 className="text-xl font-bold">{editingItem.id ? '질문 수정' : '새 질문 작성'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#2D2926]/5 rounded-full text-[#78716A]">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto grow space-y-8">
                <div className="bg-[#F2EFE9] p-5 rounded-xl border border-[rgba(45,41,38,0.1)]">
                  <h3 className="text-sm font-bold text-[#2D2926] mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#C48C5E]" />
                    AI 보조 작성
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-white border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C48C5E]"
                      placeholder="설명하고 싶은 주제 입력 (예: 기독교가 독단적인가요?)"
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                    />
                    <button
                      onClick={generateWithAI}
                      disabled={aiLoading}
                      className="bg-[#C48C5E] text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-[#a5744d] transition-colors"
                    >
                      {aiLoading ? '생성 중...' : '생성하기'}
                    </button>
                  </div>
                  <p className="text-[12px] text-[#78716A] mt-2">주의: 기존 작성 내용이 AI 결과로 덮여씌워집니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-[#2D2926] mb-1.5">구분(Category)</label>
                    <select
                      className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-2.5 outline-none focus:border-[#C48C5E] shadow-sm text-sm"
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#2D2926] mb-1.5">정렬 순서</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-2.5 outline-none focus:border-[#C48C5E] shadow-sm text-sm"
                      value={editingItem.order}
                      onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-[#2D2926] mb-1.5">질문 (한글)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-2.5 outline-none focus:border-[#C48C5E] shadow-sm text-sm font-medium"
                      value={editingItem.question}
                      onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#2D2926] mb-1.5">질문 (영문)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-2.5 outline-none focus:border-[#C48C5E] shadow-sm text-sm font-medium"
                      value={editingItem.questionEn}
                      onChange={(e) => setEditingItem({ ...editingItem, questionEn: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2D2926] mb-1.5">검색 키워드 (띄어쓰기로 구분)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-2.5 outline-none focus:border-[#C48C5E] shadow-sm text-sm"
                    value={editingItem.keywords}
                    onChange={(e) => setEditingItem({ ...editingItem, keywords: e.target.value })}
                    placeholder="예: 하나님 존재 증거 god evidence"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2D2926] mb-1.5">짧은 핵심 문구 (Short Answer - &lt;br/&gt; 포함 가능)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-[rgba(45,41,38,0.1)] rounded-xl px-4 py-3 outline-none focus:border-[#C48C5E] shadow-sm font-serif italic text-base text-[#C48C5E]"
                    value={editingItem.shortAnswer}
                    onChange={(e) => setEditingItem({ ...editingItem, shortAnswer: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#2D2926] mb-1.5">상세 답변 (워드프레스형 에디터)</label>
                  <div className="bg-white rounded-xl overflow-hidden border border-[rgba(45,41,38,0.1)] focus-within:border-[#C48C5E] shadow-sm">
                    <ReactQuill 
                      theme="snow"
                      value={editingItem.fullAnswer}
                      onChange={(content) => setEditingItem({ ...editingItem, fullAnswer: content })}
                      className="h-[250px] mb-10"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'video', 'image'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-[rgba(45,41,38,0.1)] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-[#2D2926]">관련 미디어 (유튜브 영상, 음원, 책, 팟캐스트)</label>
                    <button
                      type="button"
                      onClick={addMediaRow}
                      className="text-xs bg-white border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1 hover:bg-[#F2EFE9] transition-colors"
                    >
                      + 항목 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingItem.media?.map((m, index) => (
                      <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-[rgba(45,41,38,0.1)] flex flex-wrap gap-4 relative pr-10">
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute right-3 top-3 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                        
                        <div className="w-[120px]">
                          <select
                            className="w-full bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs"
                            value={m.type}
                            onChange={(e) => updateMedia(index, 'type', e.target.value as any)}
                          >
                            <option value="video">비디오(유튜브)</option>
                            <option value="audio">오디오(플레이리스트)</option>
                            <option value="book">책</option>
                            <option value="podcast">팟캐스트</option>
                          </select>
                        </div>
                        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="제목 (예: One Question ep.01)"
                            className="bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs"
                            value={m.title}
                            onChange={(e) => updateMedia(index, 'title', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="부제목 (예: 3:24 또는 ibigband — 관련 수록곡)"
                            className="bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs"
                            value={m.subtitle}
                            onChange={(e) => updateMedia(index, 'subtitle', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="링크 Url (음악링크, 유튜브 링크, 도서 정보 링크 등)"
                            className="w-full h-[34px] mb-2 bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs"
                            value={m.link}
                            onChange={(e) => updateMedia(index, 'link', e.target.value)}
                          />
                          {m.type === 'video' && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="영상 커버 위 글씨 (ONE QUESTION) - 선택사항"
                                className="bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs"
                                value={m.coverTitle || ''}
                                onChange={(e) => updateMedia(index, 'coverTitle', e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="영상 커버 아래 글씨 ('Is there a God?') - 선택사항"
                                className="bg-[#FAF9F6] border border-[rgba(45,41,38,0.1)] rounded-lg px-3 py-1.5 outline-none focus:border-[#C48C5E] text-xs font-serif italic"
                                value={m.coverSubtitle || ''}
                                onChange={(e) => updateMedia(index, 'coverSubtitle', e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {editingItem.media?.length === 0 && (
                      <p className="text-xs text-[#78716A]">추가된 미디어가 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[rgba(45,41,38,0.1)] shrink-0 flex justify-end gap-3 bg-white rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#78716A] hover:bg-[#F2EFE9] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#2D2926] text-white hover:bg-black disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
