"use client";

import {
  Share2, Printer, Plus, Play, FileText, Calendar,
  X, Type, Search, UploadCloud, Library, Mic, FileAudio,
  Music, Sparkles, Smartphone, ChevronRight, LayoutDashboard,
  MoreVertical, FileVideo, Download, Pause, Clock, Cloud, HardDrive,
  Mail, Loader2, Trash2, FolderOpen, MapPin, Bell, Send,
  Image, Megaphone, Eye, ClipboardPaste, Edit3, Archive, Check
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/lib/firebase/auth';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import useDrivePicker from 'react-google-drive-picker';
import { PDFDocument } from 'pdf-lib';

import ImportModal, { type LibraryItem } from '@/components/setlist/ImportModal';
import TextEditorModal from '@/components/setlist/TextEditorModal';
import SetlistManagerModal from '@/components/setlist/SetlistManagerModal';
import EmailShareModal from '@/components/setlist/EmailShareModal';
import ArchivePanel, { saveToArchive } from '@/components/setlist/ArchivePanel';
import { generateCueSheetPdf } from '@/components/setlist/cueSheetPdf';
import LyricsPresentationModal, { type LyricsSlide } from '@/components/setlist/LyricsPresentationModal';

// --- Types ---
type ItemType = 'sheet' | 'mr' | 'bgm' | 'transcript' | 'guide';

interface SavedSetlist {
  id: string;
  title: string;
  items: LibraryItem[];
  createdAt?: any;
  category?: string;
}

interface ScheduleItem {
  id: string;
  type: 'event' | 'practice' | 'travel' | 'rehearsal' | 'notice';
  time: string;
  date?: string;
  title: string;
  location?: string;
  memo?: string;
}

export default function SetListPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Setlist
  const [setlistTitle, setSetlistTitle] = useState('새로운 셋리스트');
  const [currentSetlistId, setCurrentSetlistId] = useState<string | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [savedSetlists, setSavedSetlists] = useState<SavedSetlist[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<'library' | 'ai-search' | 'upload' | 'schedule' | 'archive'>('library');
  const [mobileView, setMobileView] = useState<'files' | 'setlist'>('setlist');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isFetchingLibrary, setIsFetchingLibrary] = useState(false);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isArchiveFullscreen, setIsArchiveFullscreen] = useState(false);
  const [isLyricsPresentOpen, setIsLyricsPresentOpen] = useState(false);
  const [lyricsPresentSlides, setLyricsPresentSlides] = useState<LyricsSlide[]>([]);

  // Item preview modals
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<{ title: string; content: string } | null>(null);

  // Library rename
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Archive save popup
  const [archiveSaveItem, setArchiveSaveItem] = useState<LibraryItem | null>(null);
  const [archiveSaveKey, setArchiveSaveKey] = useState('');
  const [archiveSaveLang, setArchiveSaveLang] = useState('');
  const [archiveSaveTags, setArchiveSaveTags] = useState<string[]>([]);
  const [archiveTagInput, setArchiveTagInput] = useState('');

  // Schedule
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    type: 'event', time: '09:00', title: '', date: new Date().toISOString().split('T')[0], location: '', memo: ''
  });

  // Audio
  const [playingItem, setPlayingItem] = useState<LibraryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState('0:00');

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading, signInWithGoogle } = useAuth();
  const [openPicker] = useDrivePicker();

  // --- Filtered library ---
  const filteredLibrary = useMemo(() => {
    if (!librarySearchQuery.trim()) return libraryItems;
    const q = librarySearchQuery.toLowerCase();
    return libraryItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.note || '').toLowerCase().includes(q)
    );
  }, [libraryItems, librarySearchQuery]);

  const existingSourceIds = useMemo(() => new Set(libraryItems.map(i => i.sourceId).filter(Boolean) as string[]), [libraryItems]);

  // --- Persist library ---
  useEffect(() => {
    if (isMounted && libraryItems.length > 0) {
      localStorage.setItem('ibigband_library_items', JSON.stringify(libraryItems));
    }
  }, [libraryItems, isMounted]);

  // --- Init ---
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('ibigband_library_items');
    if (stored) {
      try { setLibraryItems(JSON.parse(stored)); } catch {}
    }
    if (!user) return;
    refreshSetlists();
    fetchSchedules();
  }, [user]);

  const refreshSetlists = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'setlists'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const sn = await getDocs(q);
      setSavedSetlists(sn.docs.map(d => ({ id: d.id, ...d.data() } as SavedSetlist)));
    } catch (e) { console.error(e); }
  };

  const fetchSchedules = async () => {
    try {
      const sn = await getDocs(query(collection(db, 'schedules')));
      const data = sn.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const today = new Date().toISOString().split('T')[0];
      const upcoming = data.filter((d: any) => d.date >= today).sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time));
      setSchedules(upcoming.slice(0, 20).map((d: any) => ({
        id: d.id, type: d.type === 'service' ? 'event' : d.type, time: d.time, title: d.title,
        date: d.date, location: d.location || '', memo: d.memo || ''
      })));
    } catch (e) { console.error(e); }
  };

  // --- Loading / Auth ---
  if (loading || !isMounted) return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-bold text-xl text-[#2D2926]">Loading...</div>;
  if (!user) return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-handwriting text-[#E6C79C] mb-6">ibiGband</h1>
      <h2 className="text-2xl font-bold text-[#2D2926] mb-4">밴드 멤버 전용 페이지입니다</h2>
      <p className="text-[#78716A] mb-8 max-w-md">로그인 후 셋리스트, 악보, 미디어를 관리할 수 있습니다.</p>
      <button onClick={signInWithGoogle} className="bg-[#2D2926] text-white px-8 py-4 rounded-full font-bold hover:bg-[#8C6B1C] transition-colors">Google 계정으로 로그인</button>
    </div>
  );

  // === Helpers ===
  const calculateTotalDuration = () => {
    let sec = 0;
    items.forEach(item => {
      if (item.duration) {
        const p = item.duration.split(':');
        if (p.length === 2) sec += parseInt(p[0]) * 60 + parseInt(p[1]);
      }
    });
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: ItemType, size: number = 16) => {
    switch(type) {
      case 'sheet': return <FileText size={size} />;
      case 'mr': return <Music size={size} />;
      case 'bgm': return <Play size={size} />;
      case 'transcript': return <Type size={size} />;
      case 'guide': return <Mic size={size} />;
      default: return <FileText size={size} />;
    }
  };

  const getTypeLabel = (type: string) => {
    const m: Record<string, string> = { sheet: '악보', mr: 'MR/트랙', bgm: 'BGM', transcript: '멘트/원고', guide: '가이드' };
    return m[type] || '기타';
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'sheet': return 'bg-[#2D2926] text-white';
      case 'mr': return 'bg-[#78716A] text-white';
      case 'bgm': return 'bg-[#E6C79C] text-[#2D2926]';
      case 'transcript': return 'bg-white border border-[#2D2926]/20 text-[#2D2926]';
      case 'guide': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // === Library actions ===
  const addToSetlist = (item: LibraryItem) => {
    setItems(prev => [...prev, { ...item, id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  };

  const removeFromSetlist = (id: string) => setItems(items.filter(i => i.id !== id));

  const removeFromLibrary = (id: string) => {
    setLibraryItems(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem('ibigband_library_items', JSON.stringify(next));
      return next;
    });
  };

  const renameLibraryItem = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setLibraryItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, title: newTitle.trim() } : i);
      localStorage.setItem('ibigband_library_items', JSON.stringify(next));
      return next;
    });
    setRenamingItemId(null);
  };

  const saveItemToArchive = (item: LibraryItem) => {
    setArchiveSaveItem(item);
    setArchiveSaveKey('');
    setArchiveSaveLang('');
    setArchiveSaveTags([]);
    setArchiveTagInput('');
  };

  const confirmArchiveSave = async () => {
    if (!archiveSaveItem || !user) return;
    const n = await saveToArchive(user.uid, [archiveSaveItem], undefined, { musicalKey: archiveSaveKey, lang: archiveSaveLang, tags: archiveSaveTags });
    if (n > 0) alert('아카이브에 저장되었습니다!');
    else alert('이미 아카이브에 있습니다.');
    setArchiveSaveItem(null);
  };

  const clearLibrary = () => {
    if (!confirm('라이브러리를 모두 비우시겠습니까?')) return;
    setLibraryItems([]);
    localStorage.removeItem('ibigband_library_items');
  };

  // === File upload ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const isAudio = file.type.startsWith('audio/');
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isAudio && !isPdf && !isImage) { alert('PDF, 이미지 또는 오디오 파일만 가능합니다.'); return; }

    try {
      const storageRef = ref(storage, `setlist_files/${user.uid}/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', () => {}, (err) => { console.error(err); alert('업로드 오류'); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          const item: LibraryItem = {
            id: `upload-${Date.now()}`, type: (isPdf || isImage) ? 'sheet' : 'mr',
            title: file.name.replace(/\.[^/.]+$/, ""), author: user.displayName || '업로드',
            duration: '', note: isImage ? '이미지 악보' : '직접 업로드', hasAudio: isAudio, hasPdf: isPdf,
            fileUrl: (isPdf || isImage) ? url : '', audioUrl: isAudio ? url : '', youtubeUrl: '',
            source: 'upload', sourceId: `upload-${file.name}-${file.size}`,
          };
          setLibraryItems(prev => [item, ...prev]);
          saveToArchive(user.uid, [item]);
          alert(`${file.name} 업로드 완료!`);
          setActiveTab('library');
        }
      );
    } catch { alert('업로드 실패'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // === Google Drive ===
  const importFromGoogleDrive = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '',
      viewId: "DOCS", showUploadView: true, supportDrives: true, multiselect: true,
      callbackFunction: async (data: any) => {
        if (data.action !== 'picked') return;
        // Get OAuth token from picker response or global gapi
        const accessToken = data.access_token || data.token
          || (window as any).gapi?.auth?.getToken?.()?.access_token;

        const newItems: LibraryItem[] = [];
        let dupes = 0;
        let uploadCount = 0;

        for (const gDoc of data.docs) {
          const sid = `gdrive-${gDoc.id}`;
          if (existingSourceIds.has(sid)) { dupes++; continue; }
          const isPdf = gDoc.mimeType?.includes('pdf');
          const isAudio = gDoc.mimeType?.includes('audio');
          const isImage = gDoc.mimeType?.includes('image');

          let fileUrl = '';
          let audioUrl = '';

          // Use server-side proxy to download from GDrive (avoids CORS)
          if (accessToken && (isPdf || isAudio || isImage)) {
            try {
              const proxyRes = await fetch('/api/setlist/gdrive-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileId: gDoc.id,
                  accessToken,
                  fileName: gDoc.name || 'file',
                  userId: user.uid,
                }),
              });
              if (proxyRes.ok) {
                const { url } = await proxyRes.json();
                if (isPdf || isImage) fileUrl = url;
                if (isAudio) audioUrl = url;
                uploadCount++;
              } else {
                console.error('Proxy error:', await proxyRes.text());
              }
            } catch (e) { console.error('GDrive proxy error:', e); }
          }

          newItems.push({
            id: sid, type: (isPdf || isImage) ? 'sheet' : isAudio ? 'mr' : 'transcript',
            title: (gDoc.name || '제목 없음').replace(/\.[^/.]+$/, ''), author: '구글 드라이브', duration: '',
            note: '구글 드라이브', hasAudio: isAudio, hasPdf: isPdf,
            fileUrl, audioUrl, youtubeUrl: '',
            source: 'gdrive', sourceId: sid,
          });
        }
        if (newItems.length > 0) {
          setLibraryItems(prev => [...newItems, ...prev]);
          saveToArchive(user.uid, newItems);
        }
        const msg = newItems.length > 0
          ? `${newItems.length}개 가져옴 (${uploadCount}개 파일 업로드)${dupes > 0 ? `, 중복 ${dupes}개 건너뜀` : ''}`
          : '모두 중복입니다.';
        alert(msg);
        setActiveTab('library');
      },
    });
  };

  // === Setlist CRUD ===
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const arr = Array.from(items);
    const [moved] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, moved);
    setItems(arr);
  };

  const saveSetlist = async () => {
    if (!user || items.length === 0) { alert('항목을 추가해주세요.'); return; }
    try {
      const clean = items.map(item => {
        const o: Record<string, any> = {};
        Object.entries(item).forEach(([k, v]) => { if (v !== undefined) o[k] = v; });
        return o;
      });
      const data = { title: setlistTitle, items: clean, updatedAt: serverTimestamp(), userId: user.uid };
      if (currentSetlistId) {
        await updateDoc(doc(db, 'setlists', currentSetlistId), data);
        alert('저장됨');
      } else {
        const ref = await addDoc(collection(db, 'setlists'), { ...data, createdAt: serverTimestamp() });
        setCurrentSetlistId(ref.id);
        alert('새 셋리스트 생성됨');
      }
      refreshSetlists();
    } catch (e: any) { alert('저장 오류: ' + e.message); }
  };

  const loadSetlist = (id: string) => {
    const sl = savedSetlists.find(s => s.id === id);
    if (sl) { setItems(sl.items || []); setSetlistTitle(sl.title || '제목 없음'); setCurrentSetlistId(sl.id); }
  };

  const createNewSetlist = () => {
    if (items.length > 0 && !confirm('현재 내용이 초기화됩니다.')) return;
    setItems([]); setSetlistTitle('새로운 셋리스트'); setCurrentSetlistId(null);
  };

  const handleDeleteSetlist = (id: string) => {
    setSavedSetlists(prev => prev.filter(s => s.id !== id));
    if (currentSetlistId === id) { setItems([]); setSetlistTitle('새로운 셋리스트'); setCurrentSetlistId(null); }
  };

  // === Exports ===
  const exportMasterPdf = async (): Promise<Uint8Array | null> => {
    const merged = await PDFDocument.create();
    let has = false;
    for (const item of items) {
      if (item.hasPdf && item.fileUrl) {
        try {
          const bytes = await fetch(item.fileUrl).then(r => r.arrayBuffer());
          const pdf = await PDFDocument.load(bytes);
          const pages = await merged.copyPages(pdf, pdf.getPageIndices());
          pages.forEach(p => merged.addPage(p));
          has = true;
        } catch (e) { console.error(`PDF load error: ${item.title}`, e); }
      }
    }
    return has ? merged.save() : null;
  };

  const handleExportMasterPdf = async () => {
    setIsExporting(true);
    try {
      const bytes = await exportMasterPdf();
      if (!bytes) { alert('PDF가 포함된 항목이 없습니다.'); return; }
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${setlistTitle}_마스터악보.pdf`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e: any) { alert('PDF 오류: ' + e.message); }
    finally { setIsExporting(false); }
  };

  const handleExportCueSheet = async () => {
    try {
      const bytes = await generateCueSheetPdf(setlistTitle, items, calculateTotalDuration());
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${setlistTitle}_큐시트.pdf`; a.click(); URL.revokeObjectURL(a.href);
    } catch (e: any) { alert('큐시트 생성 오류: ' + e.message); }
  };

  // === Email send ===
  const handleEmailSend = async (params: { to: string[]; includeOverview: boolean; includeCueSheet: boolean; includeMasterPdf: boolean; includeSchedule: boolean }) => {
    const idToken = await user.getIdToken();

    // Build HTML body
    let html = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto">
      <h2 style="color:#2D2926;border-bottom:2px solid #E6C79C;padding-bottom:10px">${setlistTitle}</h2>`;

    if (params.includeOverview) {
      const rows = items.map((item, i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:bold">${i + 1}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #eee"><span style="background:#f0ebe4;padding:2px 6px;border-radius:4px;font-size:11px">${getTypeLabel(item.type)}</span></td>
         <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:bold">${item.title}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#78716A">${item.author || ''}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${item.duration || '-'}</td></tr>`
      ).join('');
      html += `<p style="color:#78716A">${items.length}곡 · 예상 시간 ${calculateTotalDuration()}</p>
        <table style="width:100%;border-collapse:collapse"><thead><tr style="background:#2D2926;color:white">
        <th style="padding:8px">#</th><th style="padding:8px">구분</th><th style="padding:8px">제목</th><th style="padding:8px">아티스트</th><th style="padding:8px">시간</th>
        </tr></thead><tbody>${rows}</tbody></table>`;
    }

    if (params.includeSchedule && schedules.length > 0) {
      const schedTypeLabels: Record<string, string> = {
        event: '🎵 예배/공연', practice: '🎸 연습', travel: '🚗 이동', rehearsal: '🎤 리허설', notice: '📢 공지'
      };
      const sRows = schedules.map(s => {
        const dateStr = s.date ? `${s.date.slice(5).replace('-', '/')} ` : '';
        return `<tr style="border-bottom:1px solid #f0ebe4">
          <td style="padding:10px 8px;font-weight:bold;color:#8C6B1C;white-space:nowrap;vertical-align:top">${dateStr}${s.time}</td>
          <td style="padding:10px 8px;vertical-align:top">
            <span style="background:#f0ebe4;padding:2px 8px;border-radius:4px;font-size:11px;color:#78716A">${schedTypeLabels[s.type] || s.type}</span>
          </td>
          <td style="padding:10px 8px;vertical-align:top">
            <strong style="color:#2D2926">${s.title}</strong>
            ${s.location ? `<br><span style="font-size:12px;color:#78716A">📍 ${s.location}</span>` : ''}
            ${s.memo ? `<br><span style="font-size:11px;color:#9CA3AF;font-style:italic">💬 ${s.memo}</span>` : ''}
          </td>
        </tr>`;
      }).join('');
      html += `<h3 style="margin-top:24px;color:#2D2926;border-bottom:2px solid #E6C79C;padding-bottom:8px">📅 일정 타임라인</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#2D2926;color:white">
            <th style="padding:8px;text-align:left">시간</th>
            <th style="padding:8px;text-align:left">구분</th>
            <th style="padding:8px;text-align:left">내용</th>
          </tr></thead>
          <tbody>${sRows}</tbody>
        </table>`;
    }

    html += `<p style="color:#78716A;font-size:11px;margin-top:24px">Sent from <strong>ibiGband Smart Setlist</strong></p></div>`;

    // Build attachments - upload to Storage to avoid body size limits
    const attachments: { filename: string; path: string }[] = [];

    const uploadTempPdf = async (bytes: Uint8Array, name: string): Promise<string> => {
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const storageRef = ref(storage, `temp_email/${user.uid}/${Date.now()}_${name}`);
      await uploadBytesResumable(storageRef, blob);
      return getDownloadURL(storageRef);
    };

    if (params.includeCueSheet) {
      try {
        const cueSchedules = params.includeSchedule ? schedules : undefined;
        const cueBytes = await generateCueSheetPdf(setlistTitle, items, calculateTotalDuration(), cueSchedules);
        const url = await uploadTempPdf(cueBytes, '큐시트.pdf');
        attachments.push({ filename: `${setlistTitle}_큐시트.pdf`, path: url });
      } catch (e) { console.error('cue sheet gen error', e); }
    }

    if (params.includeMasterPdf) {
      try {
        const masterBytes = await exportMasterPdf();
        if (masterBytes) {
          const url = await uploadTempPdf(masterBytes, '마스터악보.pdf');
          attachments.push({ filename: `${setlistTitle}_마스터악보.pdf`, path: url });
        }
      } catch (e) { console.error('master pdf gen error', e); }
    }

    const res = await fetch('/api/admin/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify({ to: params.to, subject: `[ibiGband] ${setlistTitle}`, html, attachments }),
    });
    if (!res.ok) {
      let errMsg = '전송 실패';
      try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
      throw new Error(errMsg);
    }
  };

  // === Audio ===
  const togglePlay = (item: LibraryItem) => {
    if (!item.audioUrl && item.youtubeUrl) { window.open(item.youtubeUrl, '_blank'); return; }
    if (!item.audioUrl) { alert("음원 파일이 없습니다."); return; }
    if (playingItem?.id === item.id) {
      isPlaying ? audioRef.current?.pause() : audioRef.current?.play().catch(() => {});
      setIsPlaying(!isPlaying);
    } else {
      setPlayingItem(item); setIsPlaying(true);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = item.audioUrl; audioRef.current.load(); audioRef.current.play().catch(() => {}); }
    }
  };

  // === AI Search ===
  const doAiSearch = () => {
    if (!searchQuery) return;
    setIsAiSearching(true);
    setTimeout(() => {
      setIsAiSearching(false);
      window.open(`https://www.perplexity.ai/search?q=${encodeURIComponent(searchQuery + " CCM 악보 pdf")}`, '_blank');
      setSearchQuery('');
    }, 1200);
  };

  // === Schedule add ===
  const addSchedule = async () => {
    if (!newSchedule.title || !newSchedule.time || !newSchedule.date) return;
    try {
      const ref = await addDoc(collection(db, 'schedules'), {
        title: newSchedule.title, date: newSchedule.date, time: newSchedule.time,
        type: newSchedule.type, location: newSchedule.location || '', memo: newSchedule.memo || '',
        target: 'all', createdAt: new Date().toISOString()
      });
      setSchedules(prev => [...prev, { ...newSchedule, id: ref.id } as ScheduleItem].sort((a, b) =>
        (a.date || '').localeCompare(b.date || '') || a.time.localeCompare(b.time)
      ));
      setNewSchedule({ type: 'event', time: '09:00', title: '', date: new Date().toISOString().split('T')[0], location: '', memo: '' });
    } catch { alert('일정 등록 실패'); }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch { alert('삭제 실패'); }
  };

  // === Image paste from clipboard ===
  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !user) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const ext = file.type.split('/')[1] || 'png';
        const fileName = `paste_${Date.now()}.${ext}`;
        try {
          const storageRef = ref(storage, `setlist_files/${user.uid}/${fileName}`);
          const task = uploadBytesResumable(storageRef, file);
          task.on('state_changed', () => {}, (err) => { console.error(err); alert('업로드 오류'); },
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              const libItem: LibraryItem = {
                id: `paste-${Date.now()}`, type: 'sheet',
                title: `붙여넣기 악보 ${new Date().toLocaleTimeString('ko-KR')}`,
                author: '클립보드', duration: '',
                note: '웹에서 복사한 이미지', hasAudio: false, hasPdf: false,
                fileUrl: url, audioUrl: '', youtubeUrl: '',
                source: 'paste', sourceId: `paste-${Date.now()}`,
              };
              setLibraryItems(prev => [libItem, ...prev]);
              saveToArchive(user.uid, [libItem]);
              alert('이미지가 라이브러리에 추가되었습니다!');
              setActiveTab('library');
            }
          );
        } catch { alert('이미지 업로드 실패'); }
        break;
      }
    }
  };

  // === Item click handler ===
  const handleItemClick = (item: LibraryItem) => {
    if (item.hasPdf && item.fileUrl) {
      setPreviewPdfUrl(item.fileUrl);
    } else if (item.fileUrl && !item.hasPdf) {
      // Image file (pasted)
      setPreviewPdfUrl(item.fileUrl);
    } else if (item.hasAudio && item.audioUrl) {
      togglePlay(item);
    } else if (item.type === 'transcript' || item.type === 'guide') {
      setPreviewText({ title: item.title, content: item.note || '(내용 없음)' });
    } else if (item.youtubeUrl) {
      window.open(item.youtubeUrl, '_blank');
    }
  };

  // 가사 프레젠테이션 실행 (단일 곡 → 바로 프레젠터)
  const launchLyricsPresenter = (lyrics: { title: string; author?: string; text: string }[]) => {
    if (lyrics.length === 0) { alert('가사 데이터가 없습니다.'); return; }
    localStorage.setItem('ibigband_lyrics_presenter', JSON.stringify(lyrics));
    window.open('/setlist/presenter/lyrics', '_blank');
  };

  // 셋리스트 전체 가사 프레젠테이션 편집 모달
  const openLyricsPresentationEditor = (slides: LyricsSlide[]) => {
    setLyricsPresentSlides(slides);
    setIsLyricsPresentOpen(true);
  };

  const shareScheduleEmail = async () => {
    if (schedules.length === 0) { alert('일정이 없습니다.'); return; }
    const email = prompt('일정을 전달할 이메일 주소 (콤마 구분)');
    if (!email) return;
    const idToken = await user.getIdToken();
    const typeLabels: Record<string, string> = { event: '🙏 예배/집회', practice: '🎵 팀 연습', rehearsal: '🎧 리허설', travel: '🚗 이동/집결', notice: '📢 공지사항' };
    const rows = schedules.map(s =>
      `<tr><td style="padding:8px;font-weight:bold;color:#8C6B1C;white-space:nowrap">${s.date} ${s.time}</td>
       <td style="padding:8px"><span style="background:#f0ebe4;padding:2px 8px;border-radius:4px;font-size:12px">${typeLabels[s.type] || s.type}</span></td>
       <td style="padding:8px;font-weight:bold">${s.title}</td>
       <td style="padding:8px;color:#78716A">${s.location ? '📍 ' + s.location : ''}</td></tr>`
    ).join('');
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="border-bottom:2px solid #E6C79C;padding-bottom:8px">📅 ibiGband 일정 안내</h2>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <p style="color:#78716A;font-size:11px;margin-top:20px">ibiGband Smart Setlist</p></div>`;
    try {
      await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ to: email.split(',').map((e: string) => e.trim()), subject: '[ibiGband] 일정 안내', html }),
      });
      alert('일정 이메일 전송 완료!');
    } catch { alert('전송 실패'); }
  };

  // ==================== RENDER ====================
  return (
    <div className="pb-20 md:pb-12 px-0 md:px-6 lg:px-10 max-w-[1920px] mx-auto min-h-screen flex flex-col lg:flex-row gap-1 md:gap-6 overflow-x-hidden">

      {/* ===== 모바일 상단 뷰 전환 탭 ===== */}
      <div className="lg:hidden flex bg-white rounded-none md:rounded-xl p-1 shadow-sm border-b md:border border-[#78716A]/10 shrink-0">
        <button onClick={() => setMobileView('files')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center transition-all ${mobileView === 'files' ? 'bg-[#2D2926] text-white shadow-md' : 'text-[#78716A]'}`}>
          <Library size={14} className="inline mr-1.5 -mt-0.5" />미디어풀
        </button>
        <button onClick={() => setMobileView('setlist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-center transition-all ${mobileView === 'setlist' ? 'bg-[#2D2926] text-white shadow-md' : 'text-[#78716A]'}`}>
          <Music size={14} className="inline mr-1.5 -mt-0.5" />셋리스트 <span className="text-[10px] opacity-70">({items.length})</span>
        </button>
      </div>

      {/* ===== LEFT: Library ===== */}
      <aside className={`w-full lg:w-[480px] xl:w-[520px] flex flex-col gap-1.5 md:gap-5 lg:shrink-0 min-w-0 h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 ${mobileView !== 'files' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="bg-white rounded-none md:rounded-3xl p-1 md:p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-4 gap-0.5 md:gap-2 border-b md:border border-[#78716A]/10 shrink-0">
          {[
            { key: 'library', icon: <Library size={18} />, label: '미디어풀', active: activeTab === 'library' || activeTab === 'upload' },
            { key: 'archive', icon: <FolderOpen size={18} />, label: '아카이브', active: activeTab === 'archive' },
            { key: 'ai-search', icon: <Sparkles size={18} />, label: 'AI 검색', active: activeTab === 'ai-search' },
            { key: 'schedule', icon: <Calendar size={18} />, label: '일정', active: activeTab === 'schedule' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`py-2 md:py-3 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 md:gap-1.5 text-[11px] md:text-[13px] font-bold transition-all ${t.active ? (t.key === 'library' ? 'bg-[#2D2926] text-white' : 'bg-[#E6C79C] text-[#2D2926]') + ' shadow-md' : 'text-[#78716A] hover:bg-black/5'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white flex-1 rounded-none md:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-x-0 border-y md:border border-[#78716A]/10 overflow-hidden flex flex-col min-w-0">

          {/* Library tab */}
          {activeTab === 'library' && (
            <div className="flex flex-col h-full">
              <div className="p-3 md:p-5 border-b border-black/5 shrink-0">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <h3 className="font-bold text-base md:text-lg flex items-center gap-2"><LayoutDashboard className="text-[#E6C79C]" size={20} /> 미디어 풀</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#78716A] font-bold">{libraryItems.length}개</span>
                    {libraryItems.length > 0 && (
                      <button onClick={clearLibrary} className="text-sm text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50" title="전체 삭제">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716A]" size={16} />
                  <input type="text" value={librarySearchQuery} onChange={e => setLibrarySearchQuery(e.target.value)}
                    placeholder="악보/음원 검색..."
                    className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl pl-9 pr-3 py-2.5 md:py-3 text-sm md:text-[15px] focus:outline-none focus:border-[#2D2926]" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 md:p-4 space-y-2">
                {filteredLibrary.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716A]">
                    <Library size={36} className="mb-3 opacity-30" />
                    <p className="text-base font-bold">{librarySearchQuery ? '검색 결과 없음' : '라이브러리가 비어있습니다'}</p>
                  </div>
                )}
                {filteredLibrary.map(item => (
                  <div key={item.id} className="bg-[#FAF9F6] border border-black/5 rounded-xl p-2.5 md:p-4 hover:border-[#E6C79C] transition-all group flex items-start gap-2 md:gap-3">
                    <div className={`mt-0.5 shrink-0 p-2 rounded-lg cursor-pointer ${getTypeColor(item.type)}`} onClick={() => handleItemClick(item)}>
                      {getTypeIcon(item.type as ItemType, 18)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renamingItemId === item.id ? (
                        <div className="flex items-center gap-1.5 mb-1">
                          <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && renameLibraryItem(item.id, renameValue)}
                            className="flex-1 text-sm font-bold bg-white border border-[#E6C79C] rounded-lg px-2.5 py-1.5 focus:outline-none" autoFocus />
                          <button onClick={() => renameLibraryItem(item.id, renameValue)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                          <button onClick={() => setRenamingItemId(null)} className="p-1.5 text-[#78716A] hover:bg-black/5 rounded"><X size={16} /></button>
                        </div>
                      ) : (
                        <p className="font-bold text-[15px] text-[#2D2926] truncate cursor-pointer" onClick={() => handleItemClick(item)}>{item.title}</p>
                      )}
                      {item.author && <p className="text-[13px] text-[#78716A] truncate">{item.author}</p>}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {item.hasPdf && <span className="text-[10px] font-bold bg-[#2D2926]/10 text-[#2D2926] px-2 py-0.5 rounded">PDF</span>}
                        {item.hasAudio && (
                          <button onClick={e => { e.stopPropagation(); togglePlay(item); }}
                            className="flex items-center gap-1 text-[10px] font-bold bg-[#E6C79C]/30 hover:bg-[#E6C79C]/60 text-[#8C6B1C] px-2 py-0.5 rounded transition-colors">
                            {playingItem?.id === item.id && isPlaying ? <Pause size={10} /> : <Play fill="currentColor" size={10} />} MP3
                          </button>
                        )}
                        {item.youtubeUrl && (
                          <button onClick={e => { e.stopPropagation(); window.open(item.youtubeUrl, '_blank'); }}
                            className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">YT</button>
                        )}
                        {item.type === 'transcript' && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">텍스트</span>}
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-1 md:gap-1.5 shrink-0">
                      <button onClick={() => addToSetlist(item)} className="p-1.5 md:p-2 bg-[#E6C79C]/20 text-[#8C6B1C] hover:bg-[#E6C79C] hover:text-[#2D2926] rounded-lg transition-colors" title="셋리스트에 추가"><Plus size={15} /></button>
                      <button onClick={() => removeFromLibrary(item.id)} className="p-1.5 md:p-2 text-red-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors" title="삭제"><Trash2 size={14} /></button>
                      <button onClick={() => saveItemToArchive(item)} className="hidden md:block p-2 text-[#78716A] hover:bg-[#E6C79C]/20 hover:text-[#8C6B1C] rounded-lg transition-colors" title="아카이브에 저장"><Archive size={15} /></button>
                      <button onClick={() => { setRenamingItemId(item.id); setRenameValue(item.title); }} className="hidden md:block p-2 text-[#78716A] hover:bg-black/5 rounded-lg transition-colors" title="이름 변경"><Edit3 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 md:p-4 border-t border-black/5 shrink-0 bg-[#FAF9F6] grid grid-cols-2 gap-2 md:gap-3 sticky bottom-0 z-10">
                <button onClick={() => setActiveTab('upload')}
                  className="py-2 md:py-3.5 border border-dashed border-[#78716A]/30 rounded-xl text-[#78716A] hover:text-[#2D2926] hover:border-[#2D2926] transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold">
                  <UploadCloud size={16} /> 가져오기
                </button>
                <button onClick={() => setIsTextEditorOpen(true)}
                  className="py-2 md:py-3.5 border border-dashed border-[#78716A]/30 rounded-xl text-[#78716A] hover:text-[#2D2926] hover:border-[#2D2926] transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold">
                  <Type size={16} /> 텍스트 작성
                </button>
              </div>
            </div>
          )}

          {/* AI Search tab */}
          {activeTab === 'ai-search' && (
            <div className="p-6 flex flex-col h-full" onPaste={handleImagePaste}>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Sparkles className="text-[#E6C79C]" /> AI 악보 검색</h3>
              <p className="text-xs text-[#78716A] mb-4">곡 제목, 아티스트, 가사를 입력하면 웹에서 악보를 찾아줍니다.</p>
              <div className="relative mb-4">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doAiSearch()}
                  placeholder="'마커스 주는 완전합니다 악보'"
                  className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#E6C79C]" />
                <button onClick={doAiSearch} disabled={isAiSearching || !searchQuery}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2D2926] text-[#E6C79C] p-2 rounded-lg disabled:opacity-50"><Search size={14} /></button>
              </div>

              {/* Clipboard paste zone */}
              <div className="mb-4 border-2 border-dashed border-[#E6C79C]/40 rounded-xl p-4 text-center bg-[#E6C79C]/5 hover:bg-[#E6C79C]/10 transition-colors">
                <ClipboardPaste size={20} className="mx-auto text-[#8C6B1C] mb-1.5" />
                <p className="text-xs font-bold text-[#8C6B1C]">이미지 붙여넣기</p>
                <p className="text-[10px] text-[#78716A]">웹에서 복사한 악보 이미지를 Ctrl+V로 붙여넣으세요</p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 px-4">
                {isAiSearching ? (
                  <div className="animate-pulse flex flex-col items-center gap-3">
                    <Sparkles size={28} className="text-[#E6C79C] animate-spin" />
                    <p className="text-sm font-bold">검색 중...</p>
                  </div>
                ) : (
                  <>
                    <Search size={32} className="text-[#78716A] mb-3" />
                    <p className="text-sm font-semibold mb-1">Perplexity AI 기반 검색</p>
                    <p className="text-xs">검색 결과에서 악보 PDF/이미지를 다운로드한 뒤<br/>로컬 파일 업로드로 라이브러리에 추가하세요.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Archive tab */}
          {activeTab === 'archive' && (
            <ArchivePanel
              userId={user.uid}
              onAddToLibrary={(item) => {
                if (existingSourceIds.has(item.sourceId || '')) {
                  alert('이미 미디어풀에 있습니다.');
                  return;
                }
                setLibraryItems(prev => [item, ...prev]);
              }}
              onAddToSetlist={(item) => addToSetlist(item)}
              onPreview={(item) => handleItemClick(item)}
              onPlayAudio={(item) => togglePlay(item)}
              onLyricsPresent={openLyricsPresentationEditor}
              existingLibraryIds={existingSourceIds}
              onOpenFullscreen={() => setIsArchiveFullscreen(true)}
            />
          )}

          {/* Schedule tab */}
          {activeTab === 'schedule' && (
            <div className="p-5 flex flex-col h-full bg-[#FAF9F6]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base flex items-center gap-2"><Clock className="text-[#E6C79C]" size={18} /> 타임라인</h3>
                <button onClick={shareScheduleEmail} className="text-xs font-bold text-[#78716A] hover:text-[#2D2926] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white transition-colors">
                  <Send size={12} /> 이메일 공유
                </button>
              </div>

              {/* Add form */}
              <div className="bg-white p-3 rounded-xl border border-black/5 mb-3 shadow-sm shrink-0 space-y-2">
                <div className="flex gap-2">
                  <select value={newSchedule.type} onChange={e => setNewSchedule({...newSchedule, type: e.target.value as any})}
                    className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-2 text-xs font-bold focus:outline-none">
                    <option value="event">🙏 예배/집회</option>
                    <option value="practice">🎵 팀 연습</option>
                    <option value="rehearsal">🎧 리허설</option>
                    <option value="travel">🚗 이동/집결</option>
                    <option value="notice">📢 공지사항</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="date" value={newSchedule.date} onChange={e => setNewSchedule({...newSchedule, date: e.target.value})}
                    className="w-1/2 bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none" />
                  <input type="time" value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})}
                    className="w-1/2 bg-[#FAF9F6] border border-black/10 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none" />
                </div>
                <input type="text" placeholder="일정 내용" value={newSchedule.title || ''}
                  onChange={e => setNewSchedule({...newSchedule, title: e.target.value})}
                  className="w-full bg-[#FAF9F6] border border-black/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                <input type="text" placeholder="📍 장소" value={newSchedule.location || ''}
                  onChange={e => setNewSchedule({...newSchedule, location: e.target.value})}
                  className="w-full bg-[#FAF9F6] border border-black/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="메모 (선택)" value={newSchedule.memo || ''}
                    onChange={e => setNewSchedule({...newSchedule, memo: e.target.value})}
                    className="flex-1 bg-[#FAF9F6] border border-black/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                  <button onClick={addSchedule} className="px-4 py-1.5 bg-[#2D2926] text-white rounded-lg text-xs font-bold hover:bg-[#78716A] shrink-0">추가</button>
                </div>
              </div>

              {/* Schedule list */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {schedules.map((s, i) => {
                  const schedTypeLabels: Record<string, string> = { event: '🙏 예배/집회', practice: '🎵 연습', rehearsal: '🎧 리허설', travel: '🚗 이동', notice: '📢 공지' };
                  const schedTypeBg: Record<string, string> = { event: 'bg-[#E6C79C]/20 text-[#8C6B1C]', practice: 'bg-blue-50 text-blue-600', rehearsal: 'bg-purple-50 text-purple-600', travel: 'bg-green-50 text-green-600', notice: 'bg-amber-50 text-amber-700' };
                  return (
                    <div key={s.id} className="relative group flex items-start gap-3 bg-white p-3 rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                      {i < schedules.length - 1 && <div className="absolute left-[30px] top-full h-2 border-l-2 border-dashed border-[#E6C79C]/50 z-0" />}
                      <div className="text-[#8C6B1C] font-bold text-[11px] bg-[#E6C79C]/20 px-2 py-1 rounded-lg shrink-0 w-[52px] text-center">{s.time}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${schedTypeBg[s.type] || 'bg-gray-100 text-gray-600'}`}>
                            {schedTypeLabels[s.type] || s.type}
                          </span>
                          <p className="font-bold text-[12px] text-[#2D2926] truncate">{s.title}</p>
                        </div>
                        <div className="flex gap-2 mt-0.5 text-[10px] text-[#78716A] flex-wrap">
                          {s.date && <span className="flex items-center gap-0.5"><Calendar size={8} /> {s.date}</span>}
                          {s.location && <span className="flex items-center gap-0.5"><MapPin size={8} /> {s.location}</span>}
                        </div>
                        {s.memo && <p className="text-[10px] text-[#78716A] mt-1 bg-[#FAF9F6] px-2 py-1 rounded-lg">{s.memo}</p>}
                      </div>
                      <button onClick={() => deleteSchedule(s.id)}
                        className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
                {schedules.length === 0 && <p className="text-center text-xs text-[#78716A] py-8">등록된 일정이 없습니다.</p>}
              </div>
            </div>
          )}

          {/* Upload tab */}
          {activeTab === 'upload' && (
            <div className="p-5 flex flex-col h-full bg-[#FAF9F6] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 shrink-0">
                <h3 className="font-bold text-base">미디어 가져오기</h3>
                <button onClick={() => setActiveTab('library')} className="p-2 hover:bg-black/5 rounded-full"><X size={18} /></button>
              </div>
              <div className="flex flex-col gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,audio/mpeg,audio/wav,image/jpeg,image/png,image/webp" />
                {[
                  { icon: <HardDrive size={24} />, bg: 'bg-[#2D2926]/5', label: '내 PC에서 업로드', desc: 'PDF, MP3, WAV', onClick: () => fileInputRef.current?.click() },
                  { icon: <Music size={24} className="text-[#8C6B1C]" />, bg: 'bg-[#E6C79C]/20', label: '사이트 악보/음악', desc: '선택하여 가져오기 (중복 제외)', onClick: () => { setIsImportModalOpen(true); setActiveTab('library'); } },
                  { icon: <Cloud size={24} className="text-blue-500" />, bg: 'bg-blue-50', label: 'Google Drive', desc: '클라우드 파일 선택', onClick: importFromGoogleDrive },
                  { icon: <Type size={24} className="text-amber-700" />, bg: 'bg-amber-50', label: '텍스트 직접 작성', desc: '기도문/멘트/원고 (AI 지원)', onClick: () => { setIsTextEditorOpen(true); setActiveTab('library'); } },
                ].map((opt, i) => (
                  <div key={i} onClick={opt.onClick}
                    className="w-full py-6 border border-black/10 rounded-2xl flex flex-col items-center justify-center bg-white hover:shadow-md transition-all cursor-pointer group">
                    <div className={`${opt.bg} p-3 rounded-full mb-2 group-hover:-translate-y-1 transition-transform`}>{opt.icon}</div>
                    <p className="font-bold text-sm text-[#2D2926]">{opt.label}</p>
                    <p className="text-[10px] text-[#78716A]">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ===== RIGHT: Setlist Builder ===== */}
      <main className={`flex-1 flex flex-col min-w-0 w-full overflow-hidden ${mobileView !== 'setlist' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="bg-white rounded-none md:rounded-[2rem] shadow-none md:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-y md:border border-[#78716A]/10 flex flex-col min-h-full overflow-hidden">

          {/* Header */}
          <header className="p-3 md:p-8 border-b border-black/5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap flex-1 min-w-0">
                <span className="bg-[#2D2926] text-white text-[8px] md:text-[9px] font-bold px-2 md:px-2.5 py-0.5 rounded-full tracking-wider uppercase shrink-0">Smart Cue</span>
                <span className="text-[10px] md:text-xs text-[#78716A]">{items.length}곡</span>
                <span className="text-[#8C6B1C] bg-[#E6C79C]/30 text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full">{calculateTotalDuration()}</span>
              </div>
              <div className="flex gap-1 md:gap-2 items-center shrink-0">
                <button onClick={() => setIsManagerOpen(true)} className="p-1.5 md:p-2 bg-[#FAF9F6] border border-black/5 rounded-lg md:rounded-xl hover:bg-[#E6C79C]/20 transition-colors" title="셋리스트 관리"><FolderOpen size={15} /></button>
                <button onClick={saveSetlist} className="bg-[#2D2926] text-[#E6C79C] px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold hover:bg-[#78716A]">저장</button>
              </div>
            </div>
            <input value={setlistTitle} onChange={e => setSetlistTitle(e.target.value)}
              className="text-xl md:text-4xl font-handwriting text-[#2D2926] bg-transparent border-none outline-none hover:bg-black/5 p-1 rounded-lg w-full" placeholder="셋리스트 제목" />
            <div className="flex gap-1.5 flex-wrap mt-2">
              <button onClick={handleExportCueSheet} className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 rounded-lg border border-black/5 text-[10px] md:text-[11px] font-bold">
                <FileText size={12} /> 큐시트
              </button>
              <button onClick={handleExportMasterPdf} disabled={isExporting} className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 rounded-lg border border-black/5 text-[10px] md:text-[11px] font-bold disabled:opacity-50">
                <Printer size={12} /> {isExporting ? '생성중...' : '마스터PDF'}
              </button>
              <button onClick={() => setIsEmailModalOpen(true)} className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E6C79C]/20 rounded-lg border border-black/5 text-[10px] md:text-[11px] font-bold">
                <Mail size={12} /> 공유
              </button>
            </div>
          </header>

          {/* D&D list */}
          <div className="p-2.5 md:p-8 flex-1 bg-[#FAF9F6]/50 overflow-x-hidden">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="cue-sheet">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps}
                            className={`group relative bg-white border rounded-2xl p-2 md:p-4 flex flex-row gap-1.5 md:gap-5 items-center transition-all overflow-hidden ${snap.isDragging ? 'shadow-2xl scale-[1.02] border-[#E6C79C] z-50' : 'border-[#78716A]/10 hover:shadow-md'}`}>
                            <div {...prov.dragHandleProps} className="p-0.5 md:p-1.5 text-black/20 hover:text-[#2D2926] cursor-grab shrink-0"><MoreVertical size={16} /></div>
                            <div className="flex items-center gap-1 md:gap-3 shrink-0 cursor-pointer" onClick={() => handleItemClick(item)}>
                              <span className="text-lg md:text-3xl font-handwriting text-black/15 w-5 md:w-8 text-center">{index + 1}</span>
                              <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl shrink-0 ${getTypeColor(item.type)}`}>{getTypeIcon(item.type as ItemType, 16)}</div>
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleItemClick(item)}>
                              <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                <span className={`text-[8px] md:text-[10px] font-bold px-1.5 md:px-2.5 py-0.5 rounded-full uppercase ${getTypeColor(item.type)}`}>{getTypeLabel(item.type)}</span>
                                <h3 className="font-bold text-xs md:text-lg truncate text-[#2D2926]">{item.title}</h3>
                                {item.author && <span className="text-[10px] md:text-sm text-[#78716A] hidden sm:inline">· {item.author}</span>}
                              </div>
                              <p className="text-[10px] md:text-sm text-[#78716A] line-clamp-1">{item.note}</p>
                            </div>
                            <div className="flex items-center gap-0.5 md:gap-4 shrink-0">
                              <div className="flex gap-0 md:gap-3 text-[#78716A]">
                                {item.hasAudio && (
                                  <button onClick={() => togglePlay(item)} className="p-1 md:px-2 md:py-1 rounded-lg hover:text-[#2D2926] hover:bg-[#E6C79C]/20 transition-colors">
                                    {playingItem?.id === item.id && isPlaying ? <Pause size={14} /> : <Play fill="currentColor" size={14} />}
                                  </button>
                                )}
                                {item.hasPdf && item.fileUrl && (
                                  <button onClick={() => setPreviewPdfUrl(item.fileUrl!)} className="p-1 md:px-2 md:py-1 rounded-lg hover:text-[#2D2926] hover:bg-blue-50 transition-colors">
                                    <FileText size={14} />
                                  </button>
                                )}
                                {(item.type === 'transcript' || item.type === 'guide') && (
                                  <button onClick={() => setPreviewText({ title: item.title, content: item.note || '(내용 없음)' })} className="p-1 md:px-2 md:py-1 rounded-lg hover:text-[#2D2926] hover:bg-amber-50 transition-colors">
                                    <Eye size={14} />
                                  </button>
                                )}
                              </div>
                              <button onClick={() => removeFromSetlist(item.id)} className="p-1 md:p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <div className="py-20 text-center text-[#78716A] border-2 border-dashed border-black/10 rounded-2xl">
                        <p className="font-handwriting text-2xl mb-1">셋리스트가 비어있습니다</p>
                        <p className="text-sm">라이브러리에서 + 버튼으로 항목을 추가하세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Footer bar */}
          <div className="bg-[#2D2926] p-2 md:p-3 flex items-center justify-between gap-2 md:gap-4 text-white rounded-none md:rounded-b-[2rem] overflow-hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => playingItem && togglePlay(playingItem)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${playingItem ? 'bg-[#E6C79C] text-[#2D2926]' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                {isPlaying ? <Pause size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] text-[#E6C79C] font-bold">PRACTICE</p>
                <p className="text-xs font-semibold truncate">{playingItem?.title || '음원 선택'}</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs hidden lg:flex items-center gap-2">
              <span className="text-[9px] text-white/40 w-7 text-right">{audioCurrentTime}</span>
              <div className={`h-1 flex-1 bg-white/10 rounded-full overflow-hidden ${playingItem ? 'cursor-pointer' : ''}`}
                onClick={e => { if (!audioRef.current || !playingItem) return; const r = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX - r.left) / r.width) * audioRef.current.duration; }}>
                <div className="h-full bg-[#E6C79C] transition-all" style={{ width: `${playingItem ? audioProgress : 0}%` }} />
              </div>
            </div>
            <button onClick={() => items.length > 0 ? (() => { localStorage.setItem('ibigband_presenter_items', JSON.stringify(items)); window.open('/setlist/presenter', '_blank'); })() : alert('항목을 추가해주세요.')}
              className="hidden md:flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold whitespace-nowrap">
              <LayoutDashboard size={14} /> 프레젠터 뷰
            </button>
            <button onClick={async () => {
              if (items.length === 0) { alert('셋리스트에 곡을 추가해주세요.'); return; }
              // 아카이브에서 가사 조회
              const archiveSnap = await getDocs(collection(db, 'users', user.uid, 'archive'));
              const archiveMap = new Map<string, { lyrics: string; docId: string }>();
              archiveSnap.docs.forEach(d => {
                const data = d.data();
                if (data.lyrics) {
                  const entry = { lyrics: data.lyrics, docId: d.id };
                  if (data.sourceId) archiveMap.set(data.sourceId, entry);
                  archiveMap.set(data.title, entry);
                }
              });
              const lyricsSlides: LyricsSlide[] = items
                .map(i => {
                  const match = archiveMap.get(i.sourceId || '') || archiveMap.get(i.title);
                  const lyrics = match?.lyrics || '';
                  return { title: i.title, author: i.author, text: lyrics, sourceId: match?.docId };
                })
                .filter(s => s.text.trim());
              if (lyricsSlides.length === 0) { alert('가사가 포함된 곡이 없습니다.\n아카이브에서 AI 가사 추출을 먼저 실행해 주세요.'); return; }
              openLyricsPresentationEditor(lyricsSlides);
            }}
              className="hidden md:flex items-center gap-2 px-5 py-2 bg-violet-500/20 hover:bg-violet-500/40 text-violet-200 rounded-xl text-xs font-bold whitespace-nowrap">
              <FileText size={14} /> 가사 프레젠테이션
            </button>
          </div>

          <audio ref={audioRef} onTimeUpdate={() => {
            if (!audioRef.current) return;
            const c = audioRef.current.currentTime, d = audioRef.current.duration;
            if (d) setAudioProgress((c / d) * 100);
            setAudioCurrentTime(`${Math.floor(c / 60)}:${Math.floor(c % 60).toString().padStart(2, '0')}`);
          }} onEnded={() => { setIsPlaying(false); setAudioProgress(0); }} className="hidden" />
        </div>

        {/* ===== 모바일 하단 FAB 바 (M3 스타일) ===== */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2D2926] border-t border-white/10 px-2 py-2 safe-bottom">
          <div className="flex items-center justify-around gap-1">
            <button onClick={() => playingItem && togglePlay(playingItem)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all ${isPlaying ? 'bg-[#E6C79C]/20' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${playingItem ? 'bg-[#E6C79C] text-[#2D2926]' : 'bg-white/10 text-white/30'}`}>
                {isPlaying ? <Pause size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
              </div>
              <span className="text-[10px] text-white/60 font-medium">재생</span>
            </button>
            <button onClick={() => items.length > 0 ? (() => { localStorage.setItem('ibigband_presenter_items', JSON.stringify(items)); window.open('/setlist/presenter', '_blank'); })() : alert('항목을 추가해주세요.')}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/70">
                <LayoutDashboard size={16} />
              </div>
              <span className="text-[10px] text-white/60 font-medium">프레젠터</span>
            </button>
            <button onClick={async () => {
              if (items.length === 0) { alert('셋리스트에 곡을 추가해주세요.'); return; }
              const archiveSnap = await getDocs(collection(db, 'users', user.uid, 'archive'));
              const archiveMap = new Map<string, { lyrics: string; docId: string }>();
              archiveSnap.docs.forEach(d => {
                const data = d.data();
                if (data.lyrics) {
                  const entry = { lyrics: data.lyrics, docId: d.id };
                  if (data.sourceId) archiveMap.set(data.sourceId, entry);
                  archiveMap.set(data.title, entry);
                }
              });
              const lyricsSlides: LyricsSlide[] = items
                .map(i => {
                  const match = archiveMap.get(i.sourceId || '') || archiveMap.get(i.title);
                  const lyrics = match?.lyrics || '';
                  return { title: i.title, author: i.author, text: lyrics, sourceId: match?.docId };
                })
                .filter(s => s.text.trim());
              if (lyricsSlides.length === 0) { alert('가사가 포함된 곡이 없습니다.\n아카이브에서 AI 가사 추출을 먼저 실행해 주세요.'); return; }
              openLyricsPresentationEditor(lyricsSlides);
            }}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-violet-500/30 text-violet-200">
                <FileText size={16} />
              </div>
              <span className="text-[10px] text-white/60 font-medium">가사</span>
            </button>
            <button onClick={() => setIsArchiveFullscreen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-white/70">
                <Archive size={16} />
              </div>
              <span className="text-[10px] text-white/60 font-medium">아카이브</span>
            </button>
          </div>
        </div>
      </main>

      {/* ===== 아카이브 풀스크린 모달 ===== */}
      {isArchiveFullscreen && user && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center md:p-8">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-black/5 shrink-0">
              <h2 className="font-bold text-base md:text-xl flex items-center gap-2">
                <Archive className="text-[#E6C79C]" size={20} /> 아카이브
              </h2>
              <button onClick={() => setIsArchiveFullscreen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ArchivePanel
                userId={user.uid}
                onAddToLibrary={(item) => {
                  if (existingSourceIds.has(item.sourceId || '')) {
                    alert('이미 미디어풀에 있습니다.');
                    return;
                  }
                  setLibraryItems(prev => [item, ...prev]);
                }}
                onAddToSetlist={(item) => addToSetlist(item)}
                onPreview={(item) => handleItemClick(item)}
                onPlayAudio={(item) => togglePlay(item)}
                onLyricsPresent={openLyricsPresentationEditor}
                existingLibraryIds={existingSourceIds}
                fullscreen={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== Modals ===== */}
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}
        existingSourceIds={existingSourceIds}
        onImport={(newItems) => {
          setLibraryItems(prev => [...newItems, ...prev]);
          saveToArchive(user.uid, newItems).then(n => n > 0 && console.log(`${n}개 아카이브 저장`));
          alert(`${newItems.length}개 항목을 가져왔습니다.`);
        }} />

      <TextEditorModal isOpen={isTextEditorOpen} onClose={() => setIsTextEditorOpen(false)}
        onAdd={(data) => {
          const item: LibraryItem = {
            id: `text-${Date.now()}`, type: data.type, title: data.title, author: '', duration: '',
            note: data.note, hasAudio: false, hasPdf: false, fileUrl: '', audioUrl: '', youtubeUrl: '',
            source: 'local', sourceId: `text-${Date.now()}-${data.title}`,
          };
          setLibraryItems(prev => [item, ...prev]);
          saveToArchive(user.uid, [item]);
        }} />

      <SetlistManagerModal isOpen={isManagerOpen} onClose={() => setIsManagerOpen(false)}
        setlists={savedSetlists} currentSetlistId={currentSetlistId}
        onLoad={loadSetlist} onDelete={handleDeleteSetlist} onNew={createNewSetlist} />

      <EmailShareModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}
        setlistTitle={setlistTitle} items={items} totalDuration={calculateTotalDuration()}
        schedules={schedules} onSend={handleEmailSend} />

      <LyricsPresentationModal
        isOpen={isLyricsPresentOpen}
        onClose={() => setIsLyricsPresentOpen(false)}
        initialSlides={lyricsPresentSlides}
        setlistTitle={setlistTitle}
        onLaunchPresenter={(slides) => {
          launchLyricsPresenter(slides);
          setIsLyricsPresentOpen(false);
        }}
        onSyncToArchive={async (slides) => {
          if (!user) return;
          const updates = slides.filter(s => s.sourceId);
          await Promise.all(updates.map(s =>
            updateDoc(doc(db, 'users', user.uid, 'archive', s.sourceId!), { lyrics: s.lyrics })
          ));
        }}
      />

      {/* PDF / Image Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewPdfUrl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-black/5 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="text-[#E6C79C]" /> 악보 미리보기</h3>
              <div className="flex items-center gap-2">
                <a href={previewPdfUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold text-[#78716A] hover:text-[#2D2926] px-3 py-1.5 rounded-lg hover:bg-black/5">
                  새 탭에서 열기
                </a>
                <button onClick={() => setPreviewPdfUrl(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#FAF9F6] flex items-start justify-center p-4">
              {previewPdfUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) || previewPdfUrl.includes('paste') ? (
                <img src={previewPdfUrl} alt="악보 이미지" className="max-w-full h-auto rounded-lg shadow-md" />
              ) : (
                <iframe src={previewPdfUrl} className="w-full h-[80vh] rounded-lg" title="PDF Preview" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Save Popup */}
      {archiveSaveItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setArchiveSaveItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-black/5">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Archive className="text-[#E6C79C]" size={18} /> 아카이브에 저장
              </h3>
              <p className="text-xs text-[#78716A] mt-1 truncate">{archiveSaveItem.title}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#78716A] block mb-1">키 (Key)</label>
                <div className="flex flex-wrap gap-1.5">
                  {['', 'C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm', 'Db', 'Eb', 'Gb', 'Ab', 'Bb', 'C#', 'D#', 'F#', 'G#', 'A#', 'C#m', 'D#m', 'F#m', 'G#m', 'A#m', 'Dbm', 'Ebm', 'Gbm', 'Abm', 'Bbm'].map(k => (
                    <button key={k || 'none'} onClick={() => setArchiveSaveKey(k)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        archiveSaveKey === k
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#FAF9F6] text-[#78716A] hover:bg-blue-50'
                      }`}>
                      {k || '없음'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#78716A] block mb-1">언어</label>
                <div className="flex gap-2">
                  {[{ id: '', label: '한글' }, { id: 'EN', label: 'English' }, { id: 'SP', label: 'Spanish' }].map(l => (
                    <button key={l.id || 'kr'} onClick={() => setArchiveSaveLang(l.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        archiveSaveLang === l.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#FAF9F6] text-[#78716A] hover:bg-purple-50'
                      }`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#78716A] block mb-1">사용자 태그</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {archiveSaveTags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                      {tag}
                      <button onClick={() => setArchiveSaveTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500"><X size={8} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input type="text" value={archiveTagInput} onChange={e => setArchiveTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && archiveTagInput.trim()) {
                        const tag = archiveTagInput.trim();
                        if (!archiveSaveTags.includes(tag)) setArchiveSaveTags(prev => [...prev, tag]);
                        setArchiveTagInput('');
                      }
                    }}
                    placeholder="태그 입력 후 Enter..."
                    className="flex-1 text-[11px] bg-[#FAF9F6] border border-black/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-green-400" />
                  <button onClick={() => {
                    const tag = archiveTagInput.trim();
                    if (tag && !archiveSaveTags.includes(tag)) setArchiveSaveTags(prev => [...prev, tag]);
                    setArchiveTagInput('');
                  }} className="px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-200">추가</button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-black/5 flex justify-end gap-2">
              <button onClick={() => setArchiveSaveItem(null)}
                className="px-4 py-2 text-sm font-bold text-[#78716A] hover:bg-black/5 rounded-xl transition-colors">
                취소
              </button>
              <button onClick={confirmArchiveSave}
                className="px-5 py-2 bg-[#2D2926] text-white rounded-xl font-bold text-sm hover:bg-[#78716A] transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Preview Modal */}
      {previewText && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewText(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-black/5 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><Type className="text-[#E6C79C]" /> {previewText.title}</h3>
              <button onClick={() => setPreviewText(null)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#2D2926]">{previewText.content}</div>
            </div>
            <div className="p-4 border-t border-black/5 shrink-0 flex justify-end">
              <button onClick={() => { navigator.clipboard.writeText(previewText.content); alert('복사되었습니다!'); }}
                className="px-4 py-2 bg-[#FAF9F6] border border-black/10 rounded-xl text-sm font-bold hover:bg-[#E6C79C]/20 transition-colors">
                복사
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Uint8Array -> base64 string
function uint8ToBase64(uint8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}
