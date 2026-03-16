"use client";

import {
  Share2, Printer, Plus, Menu, Play, FileText, Calendar,
  X, Type, Search, UploadCloud, Library, Mic, FileAudio,
  Music, Sparkles, Smartphone, ChevronRight, LayoutDashboard,
  MoreVertical, FileVideo, Download, Pause, Clock, Cloud, HardDrive,
  Mail, Table, Loader2, Check
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/firebase/auth';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import useDrivePicker from 'react-google-drive-picker';
import { PDFDocument } from 'pdf-lib';

const PdfViewer = dynamic(() => import('@/components/setlist/PdfViewer'), { ssr: false });

// --- Types ---
type ItemType = 'sheet' | 'mr' | 'bgm' | 'transcript' | 'guide';
type LibrarySource = 'db' | 'upload' | 'gdrive' | 'local' | 'youtube';

interface SetListItem {
  id: string;
  type: ItemType;
  title: string;
  duration: string;
  note: string;
  author?: string;
  hasAudio?: boolean;
  hasPdf?: boolean;
  fileUrl?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  source?: LibrarySource;
  sourceId?: string; // original DB doc id for duplicate check
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
  date?: string;
  title: string;
}

export default function SetListPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Setlist State
  const [setlistTitle, setSetlistTitle] = useState('새로운 셋리스트');
  const [currentSetlistId, setCurrentSetlistId] = useState<string | null>(null);
  const [items, setItems] = useState<SetListItem[]>([]);
  const [savedSetlists, setSavedSetlists] = useState<SavedSetlist[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<'library' | 'ai-search' | 'upload' | 'schedule'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [libraryItems, setLibraryItems] = useState<SetListItem[]>([]);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

  // Schedule State
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({ type: 'event', time: '09:00', title: '', date: new Date().toISOString().split('T')[0] });

  // Audio Player State
  const [playingItem, setPlayingItem] = useState<SetListItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');

  // Email modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, loading, signInWithGoogle } = useAuth();
  const [openPicker] = useDrivePicker();

  // --- Filtered library items ---
  const filteredLibrary = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryItems;
    const q = librarySearchQuery.toLowerCase();
    return libraryItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q)
    );
  }, [libraryItems, librarySearchQuery]);

  // --- Check if item already in library (duplicate prevention) ---
  const isInLibrary = (sourceId: string) => {
    return libraryItems.some(item => item.sourceId === sourceId);
  };

  // --- Check if item already in setlist ---
  const isInSetlist = (sourceId: string) => {
    return items.some(item => item.sourceId === sourceId);
  };

  // --- Persist library to localStorage ---
  useEffect(() => {
    if (isMounted && libraryItems.length > 0) {
      localStorage.setItem('ibigband_library_items', JSON.stringify(libraryItems));
    }
  }, [libraryItems, isMounted]);

  // --- Initial data load ---
  useEffect(() => {
    setIsMounted(true);

    // Restore from localStorage first
    const storedLibrary = localStorage.getItem('ibigband_library_items');
    if (storedLibrary) {
      try {
        setLibraryItems(JSON.parse(storedLibrary));
      } catch (e) {
        console.error('Failed to parse library items from localStorage', e);
      }
    }

    if (!user) return;

    const fetchSetlists = async () => {
      try {
        const q = query(
          collection(db, 'setlists'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const sn = await getDocs(q);
        setSavedSetlists(sn.docs.map(d => ({ id: d.id, ...d.data() } as SavedSetlist)));
      } catch (e) { console.error('Failed to load setlists:', e); }
    };

    const fetchSchedulesFromDB = async () => {
      try {
        const q = query(collection(db, 'schedules'));
        const sn = await getDocs(q);
        const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const today = new Date().toISOString().split('T')[0];
        const upcoming = data.filter((d: any) => d.date >= today).sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time));
        if (upcoming.length > 0) {
          const targetDate = upcoming[0].date;
          setSchedules(upcoming.filter((d: any) => d.date === targetDate).map((d: any) => ({
            id: d.id,
            type: d.type === 'service' ? 'event' : d.type,
            time: d.time,
            title: d.title
          })));
        }
      } catch (e) { console.error('Failed to load schedules:', e); }
    };

    fetchSetlists();
    fetchSchedulesFromDB();
  }, [user]);

  // --- Loading / Auth gates ---
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

  // === Helper functions ===
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

  // === Library Import: Site DB (sheets + music) ===
  const fetchSiteLibrary = async () => {
    setIsFetchingLibrary(true);
    try {
      // Fetch sheets
      const sheetsSnap = await getDocs(query(collection(db, 'sheets'), orderBy('createdAt', 'desc')));
      const sheetsData: SetListItem[] = sheetsSnap.docs
        .filter(d => !isInLibrary(`db-sheet-${d.id}`))
        .map(d => {
          const data = d.data();
          return {
            id: `db-sheet-${d.id}`,
            type: 'sheet' as ItemType,
            title: data.title || '제목 없음',
            author: data.artist || '미상',
            duration: '',
            note: data.key ? `${data.key} Key` : '사이트 악보',
            hasAudio: !!data.audioUrl || !!data.youtubeUrl,
            hasPdf: !!data.pdfUrl || !!data.imageUrl,
            fileUrl: data.pdfUrl || data.imageUrl || '',
            audioUrl: data.audioUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            source: 'db' as LibrarySource,
            sourceId: `db-sheet-${d.id}`,
          };
        });

      // Fetch music tracks
      const musicSnap = await getDocs(query(collection(db, 'music'), orderBy('createdAt', 'desc')));
      const musicData: SetListItem[] = [];
      musicSnap.docs.forEach(d => {
        const data = d.data();
        const tracks = data.tracks || [];
        if (tracks.length > 0) {
          tracks.forEach((track: any, idx: number) => {
            const sourceId = `db-music-${d.id}-${idx}`;
            if (!isInLibrary(sourceId)) {
              musicData.push({
                id: sourceId,
                type: 'mr' as ItemType,
                title: track.title || data.title || '제목 없음',
                author: data.artist || data.description || '',
                duration: track.duration || '',
                note: `${data.type || 'Album'} · ${data.title || ''}`,
                hasAudio: !!track.audioUrl,
                hasPdf: false,
                fileUrl: '',
                audioUrl: track.audioUrl || '',
                youtubeUrl: '',
                source: 'db' as LibrarySource,
                sourceId,
              });
            }
          });
        } else if (!isInLibrary(`db-music-${d.id}`)) {
          musicData.push({
            id: `db-music-${d.id}`,
            type: 'mr' as ItemType,
            title: data.title || '제목 없음',
            author: data.artist || '',
            duration: '',
            note: data.type || 'Album',
            hasAudio: !!data.audioUrl,
            hasPdf: false,
            fileUrl: '',
            audioUrl: data.audioUrl || '',
            youtubeUrl: '',
            source: 'db' as LibrarySource,
            sourceId: `db-music-${d.id}`,
          });
        }
      });

      const newItems = [...sheetsData, ...musicData];
      if (newItems.length === 0) {
        alert('새로 가져올 항목이 없습니다. (이미 모두 라이브러리에 있음)');
      } else {
        setLibraryItems(prev => [...newItems, ...prev]);
        alert(`${newItems.length}개 항목을 사이트 라이브러리에서 가져왔습니다.`);
      }
      setActiveTab('library');
    } catch (error) {
      console.error("Error fetching site library:", error);
      alert('사이트 라이브러리 로딩 중 오류가 발생했습니다.');
    } finally {
      setIsFetchingLibrary(false);
    }
  };

  // === Library Import: Local File Upload ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf';
      if (!isAudio && !isPdf) {
        alert('지원하지 않는 파일 형식입니다. PDF 또는 오디오 파일만 업로드 가능합니다.');
        return;
      }

      const storageRef = ref(storage, `setlist_files/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          alert('파일 업로드 중 오류가 발생했습니다.');
        },
        async () => {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const newItem: SetListItem = {
            id: `upload-${Date.now()}`,
            type: isPdf ? 'sheet' : 'mr',
            title: file.name.replace(/\.[^/.]+$/, ""),
            author: user.displayName || '내 업로드',
            duration: '',
            note: '직접 업로드',
            hasAudio: isAudio,
            hasPdf: isPdf,
            fileUrl: isPdf ? fileUrl : '',
            audioUrl: isAudio ? fileUrl : '',
            youtubeUrl: '',
            source: 'upload',
            sourceId: `upload-${file.name}-${file.size}`,
          };

          setLibraryItems(prev => [newItem, ...prev]);
          alert(`${file.name} 업로드 완료!`);
          setActiveTab('library');
        }
      );
    } catch (error) {
      console.error(error);
      alert('업로드 실패');
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // === Library Import: Google Drive ===
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
      callbackFunction: async (data: any) => {
        if (data.action === 'picked') {
          try {
            const newItems: SetListItem[] = [];
            let duplicateCount = 0;

            for (const gDoc of data.docs) {
              const sourceId = `gdrive-${gDoc.id}`;

              // Duplicate check
              if (isInLibrary(sourceId)) {
                duplicateCount++;
                continue;
              }

              const isPdf = gDoc.mimeType?.includes('pdf');
              const isAudio = gDoc.mimeType?.includes('audio');

              newItems.push({
                id: sourceId,
                type: isPdf ? 'sheet' : isAudio ? 'mr' : 'transcript',
                title: gDoc.name || '제목 없음',
                author: '구글 드라이브',
                duration: '',
                note: '구글 드라이브에서 가져옴',
                hasAudio: isAudio,
                hasPdf: isPdf,
                fileUrl: isPdf ? gDoc.url : '',
                audioUrl: isAudio ? gDoc.url : '',
                youtubeUrl: '',
                source: 'gdrive',
                sourceId,
              });
            }

            if (newItems.length > 0) {
              setLibraryItems(prev => [...newItems, ...prev]);
            }

            let msg = '';
            if (newItems.length > 0) msg += `${newItems.length}개 파일을 가져왔습니다.`;
            if (duplicateCount > 0) msg += ` (중복 ${duplicateCount}개 건너뜀)`;
            if (!msg) msg = '가져올 새 파일이 없습니다. (모두 중복)';
            alert(msg);
            setActiveTab('library');
          } catch (e) {
            console.error(e);
            alert('구글 드라이브 가져오기 오류');
          }
        }
      },
    });
  };

  // === Setlist operations ===
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
    const newItem = { ...item, id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setItems(prev => [...prev, newItem]);
  };

  const openViewer = () => {
    localStorage.setItem('ibigband_presenter_items', JSON.stringify(items));
    window.open('/setlist/presenter', '_blank');
  };

  const saveSetlist = async () => {
    if (!user) return;
    if (items.length === 0) {
      alert('셋리스트에 항목을 추가한 후 저장해주세요.');
      return;
    }
    try {
      const cleanItems = items.map(item => {
        const cleanObj: Record<string, any> = {};
        Object.keys(item).forEach(key => {
          if ((item as any)[key] !== undefined) {
            cleanObj[key] = (item as any)[key];
          }
        });
        return cleanObj;
      });

      const dataToSave = {
        title: setlistTitle,
        items: cleanItems,
        updatedAt: serverTimestamp(),
        userId: user.uid,
      };

      if (currentSetlistId) {
        await updateDoc(doc(db, 'setlists', currentSetlistId), dataToSave);
        alert('셋리스트가 저장되었습니다.');
      } else {
        const docRef = await addDoc(collection(db, 'setlists'), { ...dataToSave, createdAt: serverTimestamp() });
        setCurrentSetlistId(docRef.id);
        alert('새 셋리스트가 생성되었습니다.');
      }
      // Refresh list
      const q = query(collection(db, 'setlists'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const sn = await getDocs(q);
      setSavedSetlists(sn.docs.map(d => ({ id: d.id, ...d.data() } as SavedSetlist)));
    } catch (e: any) {
      console.error(e);
      alert(`저장 중 오류: ${e.message}`);
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
    if (items.length > 0 && !confirm('현재 작성 중인 내용이 초기화됩니다. 계속하시겠습니까?')) return;
    setItems([]);
    setSetlistTitle('새로운 셋리스트');
    setCurrentSetlistId(null);
  };

  const deleteSetlist = async () => {
    if (!currentSetlistId) return;
    if (!confirm('이 셋리스트를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'setlists', currentSetlistId));
      createNewSetlist();
      const q = query(collection(db, 'setlists'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const sn = await getDocs(q);
      setSavedSetlists(sn.docs.map(d => ({ id: d.id, ...d.data() } as SavedSetlist)));
      alert('삭제되었습니다.');
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
    }
  };

  // === Export: Master PDF ===
  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const mergedPdf = await PDFDocument.create();
      let hasPdfs = false;

      for (const item of items) {
        if (item.hasPdf && item.fileUrl) {
          try {
            const pdfBytes = await fetch(item.fileUrl).then(res => res.arrayBuffer());
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            hasPdfs = true;
          } catch (e) {
            console.error(`Error loading PDF for ${item.title}:`, e);
          }
        }
      }

      if (!hasPdfs) {
        alert('악보(PDF)가 포함된 항목이 없습니다.');
        setIsExporting(false);
        return;
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${setlistTitle || 'ibigband_setlist'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error(e);
      alert("PDF 생성 중 오류: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // === Export: CSV Cue Sheet ===
  const exportCSV = () => {
    if (items.length === 0) {
      alert('셋리스트에 항목을 추가해주세요.');
      return;
    }
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const header = ['순서', '구분', '제목', '아티스트', '시간', '비고', 'PDF', '오디오', '유튜브'];
    const rows = items.map((item, idx) => [
      idx + 1,
      getTypeLabel(item.type),
      item.title,
      item.author || '',
      item.duration || '',
      item.note || '',
      item.hasPdf ? 'Y' : '',
      item.hasAudio ? 'Y' : '',
      item.youtubeUrl || '',
    ]);

    const csvContent = BOM + [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${setlistTitle || 'setlist'}_큐시트.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // === Email Share ===
  const sendSetlistEmail = async () => {
    if (!emailTo.trim()) {
      alert('수신자 이메일을 입력해주세요.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const idToken = await user.getIdToken();
      const tableRows = items.map((item, idx) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${idx + 1}</td>
          <td style="padding:8px;border:1px solid #ddd">${getTypeLabel(item.type)}</td>
          <td style="padding:8px;border:1px solid #ddd"><strong>${item.title}</strong></td>
          <td style="padding:8px;border:1px solid #ddd">${item.author || ''}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.duration || '-'}</td>
          <td style="padding:8px;border:1px solid #ddd">${item.note || ''}</td>
        </tr>`
      ).join('');

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
          <h2 style="color:#2D2926;border-bottom:2px solid #E6C79C;padding-bottom:10px">🎵 ${setlistTitle}</h2>
          <p style="color:#78716A">총 ${items.length}곡 · 예상 시간 ${calculateTotalDuration()}</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#2D2926;color:white">
                <th style="padding:10px;border:1px solid #ddd">#</th>
                <th style="padding:10px;border:1px solid #ddd">구분</th>
                <th style="padding:10px;border:1px solid #ddd">제목</th>
                <th style="padding:10px;border:1px solid #ddd">아티스트</th>
                <th style="padding:10px;border:1px solid #ddd">시간</th>
                <th style="padding:10px;border:1px solid #ddd">비고</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p style="color:#78716A;font-size:12px;margin-top:20px">
            Sent from <strong>ibiGband Smart Setlist</strong> · <a href="https://www.ibigband.com/setlist" style="color:#E6C79C">ibigband.com</a>
          </p>
        </div>
      `;

      const emails = emailTo.split(',').map(e => e.trim()).filter(Boolean);
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          to: emails,
          subject: `[ibiGband] ${setlistTitle}`,
          html,
        }),
      });

      if (response.ok) {
        alert('셋리스트가 이메일로 전송되었습니다!');
        setIsEmailModalOpen(false);
        setEmailTo('');
      } else {
        const data = await response.json();
        alert('이메일 전송 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (e: any) {
      console.error(e);
      alert('이메일 전송 중 오류: ' + e.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // === Audio Player ===
  const togglePlay = (item: SetListItem) => {
    if (!item.audioUrl && item.youtubeUrl) {
      window.open(item.youtubeUrl, '_blank');
      return;
    }
    if (!item.audioUrl) {
      alert("연결된 음원 파일이 없습니다.");
      return;
    }
    if (playingItem?.id === item.id) {
      if (isPlaying) audioRef.current?.pause();
      else audioRef.current?.play().catch(e => console.log(e));
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
      if (duration) setAudioProgress((current / duration) * 100);
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setAudioCurrentTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  // === AI Search ===
  const doAiSearch = () => {
    if (!searchQuery) return;
    setIsAiSearching(true);
    setTimeout(() => {
      setIsAiSearching(false);
      window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(searchQuery + " 악보 pdf")}`, '_blank');
      setSearchQuery('');
    }, 1500);
  };

  // === Helper Renderers ===
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

  // ===================== RENDER =====================
  return (
    <div className="pt-24 pb-12 px-4 md:px-8 max-w-screen-2xl mx-auto min-h-screen flex flex-col lg:flex-row gap-6">

      {/* ========== 1. Left Sidebar: Media Library ========== */}
      <aside className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-[calc(100vh-8rem)] sticky top-24">

        {/* Tab selector */}
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

        {/* Tab content */}
        <div className="bg-white flex-1 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#78716A]/10 overflow-hidden flex flex-col">

          {/* === Library Tab === */}
          {activeTab === 'library' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-black/5 shrink-0">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <LayoutDashboard className="text-[#E6C79C]" /> 내 미디어 풀
                  <span className="text-xs text-[#78716A] font-normal ml-auto">{libraryItems.length}개</span>
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={18} />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => setLibrarySearchQuery(e.target.value)}
                    placeholder="등록된 악보/음원 검색..."
                    className="w-full bg-[#FAF9F6] border border-black/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredLibrary.length === 0 && libraryItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716A]">
                    <Library size={32} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold mb-1">라이브러리가 비어있습니다</p>
                    <p className="text-xs">아래 버튼으로 파일을 가져오세요</p>
                  </div>
                )}
                {filteredLibrary.length === 0 && libraryItems.length > 0 && librarySearchQuery && (
                  <p className="text-center text-sm text-[#78716A] py-8">검색 결과가 없습니다.</p>
                )}
                {filteredLibrary.map((item) => (
                  <div key={item.id} className="bg-[#FAF9F6] border border-black/5 rounded-2xl p-4 hover:border-[#E6C79C] hover:shadow-md transition-all group flex items-start gap-3">
                    <div className={`mt-1 shrink-0 p-2 rounded-xl ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type, "w-4 h-4")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-[#2D2926] truncate">{item.title}</p>
                        <button
                          onClick={() => addToSetlist(item)}
                          className="text-[#78716A] hover:bg-[#E6C79C] hover:text-[#2D2926] p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="셋리스트에 추가하기"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {item.author && <p className="text-xs text-[#78716A] mt-0.5 truncate">{item.author}</p>}
                      <div className="flex gap-2 mt-2 flex-wrap">
                         {item.hasPdf && <span className="text-[10px] font-bold bg-[#2D2926]/10 text-[#2D2926] px-2 py-0.5 rounded uppercase">PDF</span>}
                         {item.hasAudio && (
                           <button
                             onClick={(e) => { e.stopPropagation(); togglePlay(item); }}
                             className="flex items-center gap-1 text-[10px] font-bold bg-[#E6C79C]/30 hover:bg-[#E6C79C]/60 text-[#8C6B1C] px-2 py-0.5 rounded uppercase transition-colors"
                           >
                             {playingItem?.id === item.id && isPlaying ? <Pause size={10} /> : <Play fill="currentColor" size={10} />} MP3
                           </button>
                         )}
                         {item.youtubeUrl && (
                           <button
                             onClick={(e) => { e.stopPropagation(); window.open(item.youtubeUrl, '_blank'); }}
                             className="flex items-center gap-1 text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded uppercase transition-colors"
                           >
                             <FileVideo size={10} /> YT
                           </button>
                         )}
                         {item.source === 'gdrive' && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Drive</span>}
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
                  <span className="text-sm font-bold">새 파일 임포트</span>
                </button>
              </div>
            </div>
          )}

          {/* === AI Search Tab === */}
          {activeTab === 'ai-search' && (
            <div className="p-6 flex flex-col h-full">
               <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                 <Sparkles className="text-[#E6C79C]" /> AI 어시스턴트 검색
               </h3>
               <p className="text-xs text-[#78716A] mb-6">찾으시는 악보 제목이나 아티스트, 가사를 입력해주세요.</p>

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

          {/* === Schedule Tab === */}
          {activeTab === 'schedule' && (
            <div className="p-6 flex flex-col h-full bg-[#FAF9F6]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Clock className="text-[#E6C79C]" /> 타임라인 관리</h3>
              </div>

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
                  <input type="date" value={newSchedule.date} onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})} className="w-1/2 bg-[#FAF9F6] border border-black/10 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:border-[#2D2926]" />
                  <input type="time" value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})} className="w-1/2 bg-[#FAF9F6] border border-black/10 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:border-[#2D2926]" />
                </div>
                <input
                  type="text" placeholder="일정 내용을 입력하세요" value={newSchedule.title || ''}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('btn-add-schedule')?.click()}
                  className="bg-[#FAF9F6] border border-black/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2D2926]"
                />
                <button
                  id="btn-add-schedule"
                  onClick={async () => {
                    if(newSchedule.title && newSchedule.time && newSchedule.date) {
                      try {
                        const docRef = await addDoc(collection(db, 'schedules'), {
                          title: newSchedule.title, date: newSchedule.date, time: newSchedule.time, type: newSchedule.type,
                          target: 'all', memo: '', createdAt: new Date().toISOString()
                        });
                        setSchedules(prev => [...prev, { ...newSchedule, id: docRef.id } as ScheduleItem].sort((a,b) => {
                          const dc = (a.date || '').localeCompare(b.date || '');
                          return dc !== 0 ? dc : a.time.localeCompare(b.time);
                        }));
                        setNewSchedule({ type: 'event', time: '09:00', title: '', date: new Date().toISOString().split('T')[0] });
                      } catch(e) { console.error(e); alert('일정 등록 실패'); }
                    }
                  }}
                  className="w-full py-2.5 bg-[#2D2926] text-white rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors mt-1"
                >
                  타임라인에 추가
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {schedules.map((sch, i) => (
                  <div key={sch.id} className="relative flex items-center gap-3 bg-white p-3 pr-4 rounded-2xl border border-black/5 shadow-sm group">
                    {i !== schedules.length - 1 && (
                      <div className="absolute left-[34px] top-full h-3 border-l-2 border-dashed border-[#E6C79C]/50 z-0" />
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
                  </div>
                ))}
                {schedules.length === 0 && <p className="text-center text-sm text-[#78716A] py-10">등록된 일정이 없습니다.</p>}
              </div>
            </div>
          )}

          {/* === Upload/Import Tab === */}
          {activeTab === 'upload' && (
            <div className="p-6 flex flex-col h-full bg-[#FAF9F6] overflow-y-auto">
              <div className="flex items-center justify-between mb-6 shrink-0">
                 <h3 className="font-bold text-lg">새 미디어 가져오기</h3>
                 <button onClick={() => setActiveTab('library')} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex flex-col gap-4">
                {/* 1. Local file */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,audio/mpeg,audio/wav" />
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

                {/* 2. Site DB (IBIG Music + Sheets) */}
                <div
                  onClick={fetchSiteLibrary}
                  className={`w-full py-8 border border-black/10 rounded-3xl flex flex-col items-center justify-center bg-white hover:border-[#E6C79C] hover:shadow-md transition-all cursor-pointer group ${isFetchingLibrary ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <div className="bg-[#E6C79C]/20 p-4 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                      {isFetchingLibrary ? <Loader2 size={28} className="text-[#8C6B1C] animate-spin" /> : <Music size={28} className="text-[#8C6B1C]" />}
                    </div>
                    <p className="font-bold text-sm mb-1 text-[#2D2926]">사이트 악보/음악 가져오기</p>
                    <p className="text-[11px] text-[#78716A]">등록된 악보 및 음원 불러오기 (중복 제외)</p>
                </div>

                {/* 3. Google Drive */}
                <div
                  onClick={importFromGoogleDrive}
                  className="w-full py-8 border border-black/10 rounded-3xl flex flex-col items-center justify-center bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                    <div className="bg-blue-50 p-4 rounded-full mb-3 group-hover:-translate-y-1 transition-transform">
                      <Cloud size={28} className="text-blue-500" />
                    </div>
                    <p className="font-bold text-sm mb-1 text-[#2D2926]">Google Drive에서 불러오기</p>
                    <p className="text-[11px] text-[#78716A]">클라우드 파일 선택 (중복 자동 감지)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========== 2. Main Content: Setlist Builder ========== */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#78716A]/10 flex flex-col min-h-full" ref={printRef}>

          {/* Header */}
          <header className="p-8 md:p-10 border-b border-black/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
             <div>
               <div className="flex items-center gap-3 mb-2 flex-wrap">
                 <span className="bg-[#2D2926] text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">IBIG Smart Cue</span>
                 <span className="text-[#78716A] text-sm flex items-center gap-1"><Calendar size={14}/> {items.length}곡</span>
                 <span className="text-[#8C6B1C] bg-[#E6C79C]/30 text-xs font-bold px-2 py-0.5 rounded-full">예상 시간: {calculateTotalDuration()}</span>
               </div>
               <input
                 value={setlistTitle}
                 onChange={(e) => setSetlistTitle(e.target.value)}
                 className="text-4xl md:text-5xl font-handwriting tracking-tight text-[#2D2926] bg-transparent border-none outline-none hover:bg-black/5 p-2 rounded-lg w-full"
                 placeholder="셋리스트 제목"
               />
             </div>

             <div className="flex flex-col gap-2 shrink-0 items-end">
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    className="bg-[#FAF9F6] text-[#2D2926] border border-black/10 px-3 py-2 rounded-xl text-sm font-bold outline-none"
                    onChange={(e) => {
                      if (e.target.value === 'new') createNewSetlist();
                      else if (e.target.value !== '') loadSetlist(e.target.value);
                    }}
                    value={currentSetlistId || 'new'}
                  >
                    <option value="new">+ 새 셋리스트</option>
                    {savedSetlists.map(sl => (
                      <option key={sl.id} value={sl.id}>{sl.title}</option>
                    ))}
                  </select>
                  <button onClick={saveSetlist} className="bg-[#2D2926] text-[#E6C79C] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors">
                    저장
                  </button>
                  {currentSetlistId && (
                    <button onClick={deleteSetlist} className="text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors" title="삭제">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={exportPDF} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 text-[#2D2926] rounded-xl transition-all border border-black/5 font-bold text-xs disabled:opacity-50">
                    <Printer size={14} /> {isExporting ? '생성 중...' : '마스터 PDF'}
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 text-[#2D2926] rounded-xl transition-all border border-black/5 font-bold text-xs">
                    <Table size={14} /> 큐시트 CSV
                  </button>
                  <button onClick={() => setIsEmailModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 text-[#2D2926] rounded-xl transition-all border border-black/5 font-bold text-xs">
                    <Mail size={14} /> 이메일 공유
                  </button>
                </div>
             </div>
          </header>

          {/* Setlist items (D&D) */}
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
                            <div
                              {...provided.dragHandleProps}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-black/20 hover:text-[#2D2926] cursor-grab active:cursor-grabbing md:static md:translate-y-0"
                            >
                              <MoreVertical size={20} />
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto ml-8 md:ml-0">
                              <span className="text-3xl font-handwriting text-black/20 w-8 text-center">{index + 1}</span>
                              <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}>
                                {getTypeIcon(item.type)}
                              </div>
                            </div>

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

                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-black/5">
                               <div className="flex gap-3 text-[#78716A]">
                                 {item.hasAudio && (
                                   <button onClick={() => togglePlay(item)} className="flex items-center gap-1 text-[11px] font-bold hover:text-[#2D2926] transition-colors">
                                     {playingItem?.id === item.id && isPlaying ? <Pause size={12} /> : <Play fill="currentColor" size={12}/>} AUDIO
                                   </button>
                                 )}
                                 {item.hasPdf && <div className="flex items-center gap-1 text-[11px] font-bold"><FileText fill="currentColor" size={12}/> SHEET</div>}
                                 {item.duration && <div className="text-xs font-semibold bg-[#FAF9F6] px-2 py-1 rounded-md">{item.duration}</div>}
                               </div>

                               <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => removeItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl">
                                    <X size={18} />
                                  </button>
                               </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {items.length === 0 && (
                      <div className="py-24 text-center text-[#78716A] border-2 border-dashed border-black/10 rounded-3xl">
                        <p className="font-handwriting text-3xl mb-2">셋리스트가 비어있습니다.</p>
                        <p className="text-sm">왼쪽 라이브러리에서 항목을 + 버튼으로 추가하세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Footer play bar */}
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
              onClick={() => items.length > 0 ? openViewer() : alert('셋리스트에 항목을 추가해주세요.')}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
            >
              <LayoutDashboard size={18} /> 프레젠터 뷰
            </button>
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleAudioEnded} className="hidden" />
        </div>
      </main>

      {/* ========== Email Share Modal ========== */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsEmailModalOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2"><Mail className="text-[#E6C79C]" /> 셋리스트 이메일 공유</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-bold text-[#2D2926] block mb-2">수신자 이메일 (콤마로 구분)</label>
              <input
                type="text"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="member1@email.com, member2@email.com"
                className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2D2926]"
              />
            </div>

            <div className="bg-[#FAF9F6] rounded-xl p-4 mb-6 text-sm text-[#78716A]">
              <p className="font-bold text-[#2D2926] mb-1">{setlistTitle}</p>
              <p>{items.length}곡 · 예상 시간 {calculateTotalDuration()}</p>
              <div className="mt-2 space-y-1">
                {items.slice(0, 5).map((item, i) => (
                  <p key={item.id} className="text-xs">{i + 1}. {item.title} {item.author ? `(${item.author})` : ''}</p>
                ))}
                {items.length > 5 && <p className="text-xs">... 외 {items.length - 5}곡</p>}
              </div>
            </div>

            <button
              onClick={sendSetlistEmail}
              disabled={isSendingEmail || !emailTo.trim() || items.length === 0}
              className="w-full py-3 bg-[#2D2926] text-white rounded-xl font-bold hover:bg-[#78716A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {isSendingEmail ? '전송 중...' : '이메일 전송'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
