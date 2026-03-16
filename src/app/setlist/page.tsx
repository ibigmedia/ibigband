"use client";

import { 
  Share2, Printer, Plus, Menu, Play, FileText, Calendar, 
  X, Type, Search, UploadCloud, Library, Mic, FileAudio, 
  Music, Sparkles, Smartphone, ChevronRight, LayoutDashboard,
  MoreVertical, FileVideo, Download, Pause, Clock, Cloud, HardDrive
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/firebase/auth';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import useDrivePicker from 'react-google-drive-picker';

const PdfViewer = dynamic(() => import('@/components/setlist/PdfViewer'), { ssr: false });

// --- Types ---
type ItemType = 'sheet' | 'mr' | 'bgm' | 'transcript' | 'guide';

interface SetListItem {
  id: string;
  type: ItemType;
  title: string;
  duration: string;
  note: string;
  author?: string;
  hasAudio?: boolean;
  hasPdf?: boolean;
  fileUrl?: string; // used for PDF viewer
  audioUrl?: string; // used for audio tag
  youtubeUrl?: string;
}

interface SavedSetlist {
  id: string;
  title: string;
  items: SetListItem[];
}

interface ScheduleItem {
  id: string;
  type: 'event' | 'practice' | 'travel' | 'rehearsal';
  time: string;
  title: string;
}

// --- Sample Data ---
const initialLibraryItems: SetListItem[] = [
  { id: 'lib-1', type: 'sheet', title: '놀라운 주의 사랑', author: '제이어스', duration: '4:30', note: 'G code, 원곡 템포', hasAudio: true, hasPdf: true },
  { id: 'lib-2', type: 'sheet', title: '내 영혼이 은총 입어', author: '어노인팅', duration: '5:15', note: '찬송가 편곡', hasAudio: true, hasPdf: true },
  { id: 'lib-3', type: 'mr', title: '예배 전 BGM 모음', author: 'IBIG BAND', duration: '15:00', note: '잔잔한 피아노 모음', hasAudio: true, hasPdf: false },
  { id: 'lib-4', type: 'transcript', title: '대표 기도문 (3월)', duration: '3:00', note: '장로님 기도 순서', hasAudio: false, hasPdf: false },
];

const initialSchedules: ScheduleItem[] = [
  { id: 'sch-1', type: 'travel', time: '08:00', title: '교회로 집결' },
  { id: 'sch-2', type: 'rehearsal', time: '09:00', title: '음향 세팅 및 리허설' },
  { id: 'sch-3', type: 'practice', time: '10:00', title: '찬양팀 최종 연습' },
  { id: 'sch-4', type: 'event', time: '11:00', title: '주일 예배 1부' },
];

export default function SetListPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Setlist State
  const [setlistTitle, setSetlistTitle] = useState('2026. 3. 22. 찬양팀 셋리스트');
  const [currentSetlistId, setCurrentSetlistId] = useState<string | null>(null);
  const [items, setItems] = useState<SetListItem[]>([]);
  const [savedSetlists, setSavedSetlists] = useState<SavedSetlist[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'library' | 'ai-search' | 'upload' | 'schedule'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<SetListItem | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [libraryItems, setLibraryItems] = useState<SetListItem[]>(initialLibraryItems);
  
  // Schedule State
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({ type: 'event', time: '09:00', title: '' });
  
  // Audio Player State
  const [playingItem, setPlayingItem] = useState<SetListItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');
  const audioRef = useRef<HTMLAudioElement>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading, signInWithGoogle } = useAuth();
  const [openPicker, authResponse] = useDrivePicker();

  useEffect(() => {
    setIsMounted(true);

    const fetchSetlists = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'setlists'), orderBy('createdAt', 'desc'));
        const sn = await getDocs(q);
        setSavedSetlists(sn.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSetlist)));
      } catch (e) { console.error('Failed to load setlists:', e); }
    };

    const fetchSheetsFromDB = async () => {
      if (!user) return; // Only fetch if authenticated

      try {
        const q = query(collection(db, 'sheets'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const sheetsData: SetListItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: `db-sheet-${doc.id}`,
            type: 'sheet',
            title: data.title || '제목 없음',
            author: data.artist || '미상',
            duration: '',
            note: '악보 데이터베이스',
            hasAudio: !!data.audioUrl || !!data.youtubeUrl,
            hasPdf: !!data.pdfUrl || !!data.imageUrl,
            fileUrl: data.pdfUrl || data.imageUrl || '',
            audioUrl: data.audioUrl || '',
            youtubeUrl: data.youtubeUrl || '',
          };
        });

        setLibraryItems(prev => {
          // Avoid duplicates if called multiple times
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = sheetsData.filter(item => !existingIds.has(item.id));
          // Put DB items first, then sample items
          return [...newItems, ...prev];
        });
      } catch (error) {
        console.error("Error fetching sheets:", error);
      }
    };

    const fetchSchedulesFromDB = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'schedules'));
        const sn = await getDocs(q);
        const data = sn.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const today = new Date().toISOString().split('T')[0];
        
        // Find schedules from today onwards
        const upcoming = data.filter(d => d.date >= today).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
        if (upcoming.length > 0) {
          // You might only want schedule for the soonest date
          const targetDate = upcoming[0].date;
          setSchedules(upcoming.filter(d => d.date === targetDate).map(d => ({
            id: d.id,
            type: d.type === 'service' ? 'event' : d.type,
            time: d.time,
            title: d.title
          })));
        } else {
           // fallback to empty
           setSchedules([]);
        }
      } catch (e) { console.error('Failed to load schedules:', e); }
    };

    fetchSheetsFromDB();
    fetchSetlists();
    fetchSchedulesFromDB();
  }, [user]);

  if (loading || !isMounted) {
    return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-bold text-xl text-[#2D2926]">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-handwriting text-[#E6C79C] mb-6">ibiGband</h1>
        <h2 className="text-2xl font-bold text-[#2D2926] mb-4">밴드 멤버 전용 페이지입니다</h2>
        <p className="text-[#78716A] mb-8 max-w-md">
          셑리스트 작성, 악보 및 미디어 다운로드, 연습 모드 등은 밴드 멤버로 로그인한 후 사용할 수 있습니다.
        </p>
        <button 
          onClick={signInWithGoogle}
          className="bg-[#2D2926] text-white px-8 py-4 rounded-full font-bold hover:bg-[#8C6B1C] transition-colors"
        >
          Google 계정으로 로그인 (멤버 인증)
        </button>
      </div>
    );
  }

  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    items.forEach(item => {
      if (item.duration) {
        const parts = item.duration.split(':');
        if (parts.length === 2) {
          totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
      }
    });
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate saving and getting URL (Phase 1)
    const fileUrl = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type === 'application/pdf';
    
    // Add fake duration for demo purposes
    const fakeDuration = isAudio ? '3:30' : '';
    
    const newItem: SetListItem = {
      id: `lib-new-${Date.now()}`,
      type: isPdf ? 'sheet' : isAudio ? 'mr' : 'transcript',
      title: file.name.replace(/\.[^/.]+$/, ""),
      duration: fakeDuration,
      note: '직접 업로드된 파일',
      hasAudio: isAudio,
      hasPdf: isPdf,
      fileUrl: isPdf ? fileUrl : '',
      audioUrl: isAudio ? fileUrl : '',
    };
    
    setLibraryItems([...libraryItems, newItem]);
    alert(`${file.name} 업로드 완료! 라이브러리에 추가되었습니다.`);
    setActiveTab('library');
  };

  // --- Functions ---
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addToSetlist = (item: SetListItem) => {
    // Generate unique ID for the setlist
    const newItem = { ...item, id: `set-${Date.now()}` };
    setItems([...items, newItem]);
  };

  const openViewer = (item: SetListItem) => {
    setActiveItem(item);
    setIsViewerOpen(true);
  };

  const saveSetlist = async () => {
    if (!user) return;
    try {
      // Remove any undefined values that Firestore rejects
      const cleanItems = items.map(item => {
        const cleanObj: any = {};
        Object.keys(item).forEach(key => {
          if ((item as any)[key] !== undefined) {
            cleanObj[key] = (item as any)[key];
          }
        });
        return cleanObj;
      });

      const data = {
        title: setlistTitle,
        items: cleanItems,
        updatedAt: serverTimestamp(),
      };
      if (currentSetlistId) {
        await updateDoc(doc(db, 'setlists', currentSetlistId), data);
        alert('셋리스트가 저장되었습니다.');
      } else {
        const docRef = await addDoc(collection(db, 'setlists'), { ...data, createdAt: serverTimestamp() });
        setCurrentSetlistId(docRef.id);
        alert('새 셋리스트가 생성되었습니다.');
      }
      // Refresh list
      const q = query(collection(db, 'setlists'), orderBy('createdAt', 'desc'));
      const sn = await getDocs(q);
      setSavedSetlists(sn.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSetlist)));
    } catch (e) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const loadSetlist = (setlistId: string) => {
    const list = savedSetlists.find(s => s.id === setlistId);
    if (list) {
      setItems(list.items);
      setSetlistTitle(list.title || '제목 없음');
      setCurrentSetlistId(list.id);
    }
  };

  const createNewSetlist = () => {
    if (confirm('현재 작성 중인 내용이 초기화됩니다. 계속하시겠습니까?')) {
      setItems([]);
      setSetlistTitle('새로운 셋리스트');
      setCurrentSetlistId(null);
    }
  };

  const doAiSearch = () => {
    if (!searchQuery) return;
    setIsAiSearching(true);
    // Simulate AI Search delay
    setTimeout(() => {
      setIsAiSearching(false);
      alert(`'${searchQuery}'에 대한 AI 검색을 완료했습니다. (임시 결과 연결 필요)`);
    }, 1500);
  };

  const importFromIbigMusic = () => {
    alert("준비 중인 기능입니다. 현재 아이빅 뮤직 앱에서 API 제공을 준비하고 있습니다.");
  };

  const importFromGoogleDrive = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '',
      viewId: "DOCS",
      showUploadView: true,
      showUploadFolders: true,
      setSelectFolderEnabled: false,
      supportDrives: true,
      multiselect: true,
      callbackFunction: (data) => {
        if (data.action === 'picked') {
          const files = data.docs.map(doc => ({
            id: `gdrive-${doc.id}`,
            type: (doc.mimeType && doc.mimeType.includes('pdf')) ? 'sheet' 
                : (doc.mimeType && doc.mimeType.includes('audio') ? 'mr' : 'transcript') as ItemType,
            title: doc.name,
            duration: '',
            note: '구글 드라이브에서 가져옴',
            hasAudio: doc.mimeType ? doc.mimeType.includes('audio') : false,
            hasPdf: doc.mimeType ? doc.mimeType.includes('pdf') : false,
            fileUrl: doc.url, 
          }));
          
          setLibraryItems(prev => [...files, ...prev]);
        }
      },
    });
  };

  const togglePlay = (item: SetListItem) => {
    if (!item.audioUrl && item.youtubeUrl) {
      window.open(item.youtubeUrl, '_blank');
      return;
    }
    
    if (!item.audioUrl) {
      alert("이 항목에는 연결된 실제 음원 파일이 없습니다. 유튜브 링크도 등록되지 않았습니다.");
      return;
    }

    if (playingItem?.id === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play().catch(e => console.log(e));
      }
      setIsPlaying(!isPlaying);
    } else {
      setPlayingItem(item);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = item.audioUrl || '';
        audioRef.current.load();
        audioRef.current.play().catch(e => console.log(e));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setAudioProgress((current / duration) * 100);
      }
      
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setAudioCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const element = printRef.current;
      // Scroll to top to ensure complete capture
      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('ibigband_setlist.pdf');
    } catch (e: any) {
      console.error(e);
      alert("출력 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Helper Renderers ---
  const getTypeIcon = (type: ItemType, className: string = "w-5 h-5") => {
    switch(type) {
      case 'sheet': return <Music className={className} />;
      case 'mr': return <FileAudio className={className} />;
      case 'bgm': return <Play className={className} />;
      case 'transcript': return <FileText className={className} />;
      case 'guide': return <Mic className={className} />;
      default: return <FileText className={className} />;
    }
  };

  const getTypeLabel = (type: ItemType) => {
    switch(type) {
      case 'sheet': return '악보';
      case 'mr': return 'MR / 트랙';
      case 'bgm': return 'BGM';
      case 'transcript': return '멘트/원고';
      case 'guide': return '진행/가이드';
      default: return '기타';
    }
  };

  const getTypeColor = (type: ItemType) => {
    switch(type) {
      case 'sheet': return 'bg-[#2D2926] text-white';
      case 'mr': return 'bg-[#78716A] text-white';
      case 'bgm': return 'bg-[#E6C79C] text-[#2D2926]';
      case 'transcript': return 'bg-white border border-[#2D2926]/20 text-[#2D2926]';
      case 'guide': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#FAF9F6]" />;

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen flex flex-col lg:flex-row gap-6">
      
      {/* 1. Left Sidebar: Media Pool (미디어 풀) */}
      <aside className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-[calc(100vh-8rem)] sticky top-24">
        
        {/* 모드 선택 탭 */}
        <div className="bg-white rounded-3xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-3 gap-2 border border-[#78716A]/10 shrink-0">
          <button 
            onClick={() => setActiveTab('library')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${activeTab === 'library' || activeTab === 'upload' ? 'bg-[#2D2926] text-white shadow-md' : 'text-[#78716A] hover:bg-black/5'}`}
          >
            <Library size={18} /> 라이브러리
          </button>
          <button 
            onClick={() => setActiveTab('ai-search')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${activeTab === 'ai-search' ? 'bg-[#E6C79C] text-[#2D2926] shadow-md' : 'text-[#78716A] hover:bg-black/5'}`}
          >
            <Sparkles size={18} /> AI 검색
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${activeTab === 'schedule' ? 'bg-[#E6C79C] text-[#2D2926] shadow-md' : 'text-[#78716A] hover:bg-black/5'}`}
          >
            <Calendar size={18} /> 일정 타임라인
          </button>
        </div>

        {/* 탭 내용 영역 */}
        <div className="bg-white flex-1 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#78716A]/10 overflow-hidden flex flex-col">
          
          {/* 라이브러리 탭 */}
          {activeTab === 'library' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-black/5 shrink-0">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <LayoutDashboard className="text-[#E6C79C]" /> 내 미디어 풀
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={18} />
                  <input 
                    type="text" 
                    placeholder="등록된 악보/음원 검색..." 
                    className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {libraryItems.map((item) => (
                  <div key={item.id} className="bg-[#FAF9F6] border border-black/5 rounded-2xl p-4 hover:border-[#E6C79C] hover:shadow-md transition-all group flex items-start gap-3">
                    <div className={`mt-1 shrink-0 p-2 rounded-xl ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type, "w-4 h-4")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-[#2D2926] truncate">{item.title}</p>
                        <button 
                          onClick={() => addToSetlist(item)}
                          className="text-[#78716A] hover:bg-[#E6C79C] hover:text-[#2D2926] p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="셋리스트에 추가하기"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {item.author && <p className="text-xs text-[#78716A] mt-0.5">{item.author}</p>}
                      <div className="flex gap-2 mt-2">
                         {item.hasPdf && <span className="text-[10px] font-bold bg-[#2D2926]/10 text-[#2D2926] px-2 py-0.5 rounded uppercase">PDF</span>}
                         {item.hasAudio && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); togglePlay(item); }}
                             className="flex items-center gap-1 text-[10px] font-bold bg-[#E6C79C]/30 hover:bg-[#E6C79C]/60 text-[#8C6B1C] px-2 py-0.5 rounded uppercase transition-colors"
                           >
                             {playingItem?.id === item.id && isPlaying ? <Pause size={10} /> : <Play fill="currentColor" size={10} />} MP3
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-black/5 shrink-0 bg-[#FAF9F6]">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="w-full py-4 border-2 border-dashed border-[#78716A]/30 rounded-2xl text-[#78716A] hover:text-[#2D2926] hover:border-[#2D2926] hover:bg-white transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <UploadCloud size={24} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-sm font-bold">새 파일 임포트 (PDF, MP3)</span>
                </button>
              </div>
            </div>
          )}

          {/* AI 검색 탭 */}
          {activeTab === 'ai-search' && (
            <div className="p-6 flex flex-col h-full">
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <Sparkles className="text-[#E6C79C]" /> AI 어시스턴트 검색
               </h3>
               <p className="text-xs text-[#78716A] mb-6">찾으시는 악보 제목이나 아티스트, 가사를 입력해주세요. AI가 웹에서 찾아 뷰어 및 다운로드를 준비합니다.</p>
               
               <div className="relative mb-4">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doAiSearch()}
                    placeholder="'마커스 주는 완전합니다' 악보 찾아줘" 
                    className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl px-4 py-4 pr-12 text-sm focus:outline-none focus:border-[#E6C79C] transition-colors shadow-inner"
                  />
                  <button 
                    onClick={doAiSearch}
                    disabled={isAiSearching || !searchQuery}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2D2926] text-[#E6C79C] p-2 rounded-xl hover:bg-[#78716A] transition-colors disabled:opacity-50"
                  >
                    <Search size={16} />
                  </button>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 px-4">
                  {isAiSearching ? (
                     <div className="animate-pulse flex flex-col items-center gap-4">
                       <Sparkles size={32} className="text-[#E6C79C] animate-spin" />
                       <p className="text-sm font-bold">인터넷 바다를 탐색 중입니다...</p>
                     </div>
                  ) : (
                    <>
                      <Music size={40} className="text-[#78716A] mb-4" />
                      <p className="text-sm font-semibold mb-2">웹 기반 자동 검색</p>
                      <p className="text-xs">CCM 악보, 유튜브 MR 트랙 등을<br/>자동으로 가져와 셋리스트에 추가할 수 있습니다.</p>
                    </>
                  )}
               </div>
            </div>
          )}

          {/* 일정 탭 */}
          {activeTab === 'schedule' && (
            <div className="p-6 flex flex-col h-full bg-[#FAF9F6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Clock className="text-[#E6C79C]" /> 타임라인 관리</h3>
              </div>
              
              {/* 스케줄 입력 폼 */}
              <div className="bg-white p-4 rounded-2xl border border-black/5 mb-4 shadow-sm shrink-0 flex flex-col gap-3">
                <select 
                  value={newSchedule.type} 
                  onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value as any})}
                  className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#2D2926]"
                >
                  <option value="event">본 집회 및 예배</option>
                  <option value="practice">팀 연습</option>
                  <option value="rehearsal">리허설 / 사운드체크</option>
                  <option value="travel">이동 및 집결</option>
                </select>
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    value={newSchedule.time} 
                    onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    className="w-1/3 bg-[#FAF9F6] border border-black/10 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:border-[#2D2926]"
                  />
                  <input 
                    type="text" 
                    placeholder="일정 내용을 입력하세요" 
                    value={newSchedule.title} 
                    onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSchedule.title && newSchedule.time) {
                        setSchedules([...schedules, { ...newSchedule, id: `sch-${Date.now()}` } as ScheduleItem].sort((a,b) => a.time.localeCompare(b.time)));
                        setNewSchedule({ type: 'event', time: '09:00', title: ''});
                      }
                    }}
                    className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2D2926]"
                  />
                </div>
                <button 
                  onClick={async () => {
                    if(newSchedule.title && newSchedule.time) {
                      const today = new Date().toISOString().split('T')[0];
                      try {
                        const docRef = await addDoc(collection(db, 'schedules'), {
                          title: newSchedule.title,
                          date: today,
                          time: newSchedule.time,
                          type: newSchedule.type,
                          target: 'all',
                          memo: '',
                          createdAt: new Date().toISOString()
                        });
                        setSchedules([...schedules, { ...newSchedule, id: docRef.id } as ScheduleItem].sort((a,b) => a.time.localeCompare(b.time)));
                        setNewSchedule({ type: 'event', time: '09:00', title: ''});
                      } catch(e) { console.error(e); alert('일정 등록 실패'); }
                    }
                  }}
                  className="w-full py-2.5 bg-[#2D2926] text-white rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors mt-1"
                >
                  타임라인에 추가
                </button>
              </div>

              {/* 스케줄 리스트 */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {schedules.map((sch, i) => (
                  <div key={sch.id} className="relative flex items-center gap-3 bg-white p-3 pr-4 rounded-2xl border border-black/5 shadow-sm group">
                    {/* 타임라인 연결 선 */}
                    {i !== schedules.length - 1 && (
                      <div className="absolute left-[34px] top-full h-3 border-l-2 border-dashed border-[#E6C79C]/50 z-0 content-['']" />
                    )}
                    
                    <div className="z-10 text-[#8C6B1C] font-bold text-sm bg-[#E6C79C]/20 px-2 py-1 rounded-lg shrink-0 w-[54px] text-center shadow-inner">
                      {sch.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] text-[#2D2926] truncate leading-tight">{sch.title}</p>
                      <p className="text-[10px] font-bold text-[#78716A] mt-0.5">
                        {sch.type === 'event' && <span className="text-blue-600">집회/예배</span>}
                        {sch.type === 'practice' && <span className="text-orange-600">팀 연습</span>}
                        {sch.type === 'rehearsal' && <span className="text-purple-600">사운드체크</span>}
                        {sch.type === 'travel' && <span className="text-gray-500">이동/집결</span>}
                      </p>
                    </div>
                    <button 
                      onClick={async () => {
                        alert("웹 프론트에서는 삭제되지 않으며 일정 관리 페이지에서 삭제해주세요.");
                      }}
                      className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <p className="text-center text-sm text-[#78716A] py-10">등록된 일정이 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* 업로드 탭 */}
          {activeTab === 'upload' && (
            <div className="p-6 flex flex-col h-full bg-[#FAF9F6] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 shrink-0">
                 <h3 className="font-bold text-lg">새 미디어 가져오기</h3>
                 <button onClick={() => setActiveTab('library')} className="p-2 hover:bg-black/5 rounded-full">
                   <X size={20} />
                 </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* 1. 로컬 파일 업로드 */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,audio/mpeg,audio/wav,text/plain" />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border border-black/10 rounded-3xl flex flex-col items-center justify-center bg-white hover:border-[#2D2926] hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="bg-[#2D2926]/5 p-4 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                      <HardDrive size={28} className="text-[#2D2926]" />
                    </div>
                    <p className="font-bold text-sm mb-1 text-[#2D2926]">내 PC에서 파일 업로드</p>
                    <p className="text-[11px] text-[#78716A]">PDF, MP3, WAV 형식</p>
                </div>

                {/* 2. IBIG Music 연동 */}
                <div 
                  onClick={importFromIbigMusic}
                  className="w-full py-8 border border-black/10 rounded-3xl flex flex-col items-center justify-center bg-white hover:border-[#E6C79C] hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="bg-[#E6C79C]/20 p-4 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                      <Music size={28} className="text-[#8C6B1C]" />
                    </div>
                    <p className="font-bold text-sm mb-1 text-[#2D2926]">IBIG Music 계정 연동</p>
                    <p className="text-[11px] text-[#78716A]">등록된 악보 및 음원 가져오기</p>
                </div>

                {/* 3. 구글 드라이브 연동 */}
                <div 
                  onClick={importFromGoogleDrive}
                  className="w-full py-8 border border-black/10 rounded-3xl flex flex-col items-center justify-center bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="bg-blue-50 p-4 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                      <Cloud size={28} className="text-blue-500" />
                    </div>
                    <p className="font-bold text-sm mb-1 text-[#2D2926]">Google Drive에서 불러오기</p>
                    <p className="text-[11px] text-[#78716A]">클라우드 공유 폴더 접속</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </aside>

      {/* 2. Main Content: Setlist / Cue Sheet Builder */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#78716A]/10 flex flex-col min-h-full" ref={printRef}>
          
          {/* 헤더 */}
          <header className="p-8 md:p-10 border-b border-black/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
             <div>
               <div className="flex items-center gap-3 mb-2">
                 <span className="bg-[#2D2926] text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">IBIG Smart Cue</span>
                 <span className="text-[#78716A] text-sm flex items-center gap-1"><Calendar size={14}/> 주일 예배 1부</span>
                 <span className="text-[#8C6B1C] bg-[#E6C79C]/30 text-xs font-bold px-2 py-0.5 rounded-full">예상 시간: {calculateTotalDuration()}</span>
               </div>
               <input 
                 value={setlistTitle}
                 onChange={(e) => setSetlistTitle(e.target.value)}
                 className="text-4xl md:text-5xl font-handwriting tracking-tight text-[#2D2926] bg-transparent border-none outline-none hover:bg-black/5 p-2 rounded-lg"
                 placeholder="셋리스트 제목"
               />
             </div>
             
             {/* 상태 및 제어 버튼 */}
             <div className="flex flex-col gap-2 shrink-0 items-end">
                <div className="flex gap-2 items-center">
                  <select 
                    className="bg-[#FAF9F6] text-[#2D2926] border border-black/10 px-3 py-2 rounded-xl text-sm font-bold outline-none"
                    onChange={(e) => {
                      if (e.target.value === 'new') createNewSetlist();
                      else if (e.target.value !== '') loadSetlist(e.target.value);
                    }}
                    value={currentSetlistId || 'new'}
                  >
                    <option value="new">+ 새 셋리스트 작성</option>
                    {savedSetlists.map(sl => (
                      <option key={sl.id} value={sl.id}>{sl.title}</option>
                    ))}
                  </select>
                  <button onClick={saveSetlist} className="bg-[#2D2926] text-[#E6C79C] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors">
                    저장하기
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportPDF} disabled={isExporting} title="PDF 추출 (현재 화면 스크린샷 캡처)" className="flex items-center gap-2 p-2 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 text-[#2D2926] rounded-xl transition-all border border-black/5 font-bold text-sm disabled:opacity-50">
                    <Printer size={16} /> {isExporting ? '생성 중...' : 'PDF 생성'}
                  </button>
                </div>
             </div>
          </header>

          {/* 셋리스트 아이템 리스트 (D&D) */}
          <div className="p-6 md:p-10 flex-1 bg-[#FAF9F6]/50">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="cue-sheet">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group relative bg-white border border-[#78716A]/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center transition-all ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-[#E6C79C] z-50' : 'hover:shadow-md hover:border-[#2D2926]/30'}`}
                          >
                            {/* D&D Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-black/20 hover:text-[#2D2926] cursor-grab active:cursor-grabbing md:static md:translate-y-0"
                            >
                              <MoreVertical size={20} />
                            </div>

                            {/* Number & Icon */}
                            <div className="flex items-center gap-4 w-full md:w-auto ml-8 md:ml-0">
                              <span className="text-3xl font-handwriting text-black/20 w-8 text-center">{index + 1}</span>
                              <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}>
                                {getTypeIcon(item.type)}
                              </div>
                            </div>
                            
                            {/* Content Info */}
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getTypeColor(item.type)}`}>
                                  {getTypeLabel(item.type)}
                                </span>
                                <h3 className="font-bold text-lg truncate text-[#2D2926]">{item.title}</h3>
                                {item.author && <span className="text-xs text-[#78716A]">· {item.author}</span>}
                              </div>
                              <p className="text-sm text-[#78716A] line-clamp-1">{item.note}</p>
                            </div>

                            {/* Actions / Meta */}
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-black/5">
                               {/* 미디어 상태 */}
                               <div className="flex gap-3 text-[#78716A]">
                                 {item.hasAudio && (
                                   <button 
                                     onClick={() => togglePlay(item)}
                                     className="flex items-center gap-1 text-[11px] font-bold hover:text-[#2D2926] transition-colors"
                                   >
                                     {playingItem?.id === item.id && isPlaying ? <Pause size={12} /> : <Play fill="currentColor" size={12}/>} AUDIO
                                   </button>
                                 )}
                                 {item.hasPdf && <div className="flex items-center gap-1 text-[11px] font-bold"><FileText fill="currentColor" size={12}/> SHEET</div>}
                                 {item.duration && <div className="text-xs font-semibold bg-[#FAF9F6] px-2 py-1 rounded-md">{item.duration}</div>}
                               </div>

                               {/* 호버 액션 버튼 */}
                               <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openViewer(item)}
                                    className="px-4 py-2 bg-[#2D2926] text-white rounded-xl text-xs font-bold hover:bg-[#78716A] flex items-center gap-1"
                                  >
                                    <Smartphone size={14} /> 뷰어
                                  </button>
                                  <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl"
                                  >
                                    <X size={18} />
                                  </button>
                               </div>
                            </div>

                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* Empty State */}
                    {items.length === 0 && (
                      <div className="py-24 text-center text-[#78716A] border-2 border-dashed border-black/10 rounded-3xl">
                        <p className="font-handwriting text-3xl mb-2">셋리스트가 비어있습니다.</p>
                        <p className="text-sm">왼쪽 라이브러리에서 항목을 클릭하거나 끌어다 놓으세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* 푸터 플레이 바 */}
          <div className="bg-[#2D2926] p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white rounded-b-[2rem] z-10 w-full">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => playingItem ? togglePlay(playingItem) : null}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform shadow-lg shrink-0 ${playingItem ? 'bg-[#E6C79C] text-[#2D2926] hover:scale-105' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                {isPlaying ? <Pause className="w-5 h-5 mx-auto" /> : <Play fill="currentColor" className="ml-1 w-5 h-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#E6C79C] font-bold mb-0.5">PRACTICE MODE</p>
                <p className="text-sm font-semibold truncate leading-tight">{playingItem ? playingItem.title : '재생할 음원을 선택해주세요'}</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md hidden lg:flex items-center gap-3">
              <span className="text-[10px] text-white/50 w-8 text-right">{playingItem ? audioCurrentTime : '0:00'}</span>
              <div 
                className={`h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative ${playingItem ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                  if (!audioRef.current || !playingItem) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = percent * audioRef.current.duration;
                }}
              >
                <div className="h-full bg-[#E6C79C] transition-all duration-150 ease-linear" style={{ width: `${playingItem ? audioProgress : 0}%` }}></div>
              </div>
              <span className="text-[10px] text-white/50 w-8">{playingItem ? (playingItem.duration || '0:00') : '0:00'}</span>
            </div>

            <button 
              onClick={() => items.length > 0 ? openViewer(items[0]) : alert('셋리스트에 항목을 추가해주세요.')}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
            >
              <LayoutDashboard size={18} /> 프레젠터 뷰 실행
            </button>
          </div>

          {/* 숨겨진 오디오 태그 요소 */}
          <audio 
            ref={audioRef} 
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleAudioEnded}
            className="hidden" 
          />
        </div>
      </main>

      {/* 3. iPad / Teleprompter Viewer Modal (아이패드용 뷰어 & 프롬프터) */}
      {isViewerOpen && activeItem && (
        <div className="fixed inset-0 z-[100] bg-[#2D2926] text-white flex flex-col animate-in fade-in duration-300">
          <header className="p-6 flex justify-between items-center bg-[#1A1816] shadow-md z-10">
            <div className="flex items-center gap-4">
               <div className={`p-2 rounded-xl text-white ${getTypeColor(activeItem.type)}`}>
                 {getTypeIcon(activeItem.type)}
               </div>
               <div>
                  <h2 className="text-2xl font-bold">{activeItem.title}</h2>
                  <p className="text-[#E6C79C] text-sm">{activeItem.author || getTypeLabel(activeItem.type)}</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
                <Download size={18}/> 파일 다운로드
              </button>
              <button onClick={() => setIsViewerOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-[#2D2926] p-8 flex items-center justify-center">
             {activeItem.type === 'sheet' ? (
                // 악보 뷰어: fileUrl이 있으면 react-pdf 로 렌더링, 없으면 안내 문구
                <div className="w-full max-w-3xl bg-white rounded-sm shadow-2xl flex flex-col items-center justify-center text-[#2D2926] min-h-[500px] overflow-hidden">
                   {activeItem.fileUrl ? (
                     <PdfViewer fileUrl={activeItem.fileUrl} />
                   ) : (
                     <>
                       <FileText size={48} className="text-black/20 mb-4" />
                       <p className="font-bold text-xl">PDF 뷰어 화면 (예제 파일 없음)</p>
                       <p className="text-[#78716A] text-sm mt-2">왼쪽 미디어 풀에서 새로운 악보 PDF 파일을 업로드 해보세요!</p>
                       
                       <div className="w-3/4 mt-12 space-y-8 opacity-20 pointer-events-none">
                         <div className="h-1 bg-black w-full relative"><div className="absolute right-0 top-1 h-1 bg-black w-full"></div><div className="absolute right-0 top-2 h-1 bg-black w-full"></div><div className="absolute right-0 top-3 h-1 bg-black w-full"></div></div>
                       </div>
                     </>
                   )}
                </div>
             ) : (
                // 프롬프터 / 가사 뷰어
                <div className="max-w-4xl text-center space-y-6">
                  <p className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-[#FAF9F6] whitespace-pre-wrap">
                    {activeItem.note || '등록된 내용이 없습니다.'}
                  </p>
                  <p className="text-[#E6C79C] text-xl font-handwriting tracking-wider pt-10">
                    -- 아이패드용 팀원 프롬프터 모드 --
                  </p>
                </div>
             )}
          </div>
          
          {/* 하단 컨트롤러 */}
          <div className="bg-[#1A1816] p-6 flex justify-between items-center border-t border-white/5">
             <div className="flex gap-4">
                <button className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 font-bold text-sm">이전</button>
             </div>
             
             {activeItem.hasAudio && (
               <div className="flex items-center gap-4 bg-white/5 pr-6 rounded-full border border-white/10">
                 <button className="w-12 h-12 bg-[#E6C79C] text-[#2D2926] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0">
                   <Play fill="currentColor" className="ml-1 w-5 h-5" />
                 </button>
                 <span className="text-sm font-bold min-w-[120px]">MR Track Playing...</span>
               </div>
             )}

             <div className="flex gap-4">
                <button className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 font-bold text-sm flex items-center gap-2">다음 <ChevronRight size={16}/></button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
