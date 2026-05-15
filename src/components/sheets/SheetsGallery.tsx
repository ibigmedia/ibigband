'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Music, PlayCircle, Activity, Hash } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useMusicStore } from '@/store/useMusicStore';
import { MusicAlbum } from '@/types/music';
import { getDocById } from '@/lib/firebase/firestore';
import { Sheet } from '@/types/sheet';
import SheetModal from '@/components/sheets/SheetModal';
import FavoriteButton from '@/components/sheets/FavoriteButton';
import { useAuth } from '@/lib/firebase/auth';
import { getFavoriteSheetIds } from '@/lib/firebase/favorites';
import { useTranslations } from 'next-intl';

interface SheetsGalleryProps {
  /** URL 진입 시 자동으로 열려야 할 sheet 문서 id (예: /sheets/[id]) */
  initialSheetId?: string;
}

/**
 * 악보 갤러리 + 모달 + 딥링크 동기화.
 *
 * 딥링크 동작:
 * - props.initialSheetId 가 있으면 해당 sheet으로 모달을 자동 오픈하고 URL은 그대로 유지합니다.
 * - 갤러리에서 카드 클릭 시 URL을 `/sheets/[id]` 로 pushState 하여 공유 가능한 주소로 만듭니다.
 * - 모달 닫기 시 `/sheets` 로 pushState 하여 갤러리 상태를 유지합니다.
 * - 브라우저 뒤로/앞으로 가기(popstate) 도 모달 열림 상태와 동기화합니다.
 */
export default function SheetsGallery({ initialSheetId }: SheetsGalleryProps) {
  const { user } = useAuth();
  const t = useTranslations('sheets');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favoriteSheetIds, setFavoriteSheetIds] = useState<string[]>([]);

  // Modal State
  const [previewSheet, setPreviewSheet] = useState<Sheet | null>(null);

  // 로그인 상태가 바뀌면 권한에 맞게 목록을 다시 불러옵니다 (프리미엄 URL 마스킹 갱신).
  useEffect(() => {
    fetchSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFavoriteSheetIds([]);
      return;
    }

    getFavoriteSheetIds(user.uid)
      .then(setFavoriteSheetIds)
      .catch((err) => {
        console.error('즐겨찾기 목록 조회 실패:', err);
      });
  }, [user]);

  const fetchSheets = async () => {
    try {
      setError(null);
      setLoading(true);

      const headers: Record<string, string> = {};
      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (tokenErr) {
          console.warn('ID 토큰 발급 실패, 게스트로 요청합니다:', tokenErr);
        }
      }

      const res = await fetch('/api/sheets/list', { headers, cache: 'no-store' });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || t('fetchListError', { status: res.status }));
      }
      const body = await res.json() as { sheets: Sheet[] };
      const data = (body.sheets || []).map((d) => ({
        ...d,
        title: d.title ? d.title.normalize('NFC') : '',
        artistId: d.artistId ? d.artistId.normalize('NFC') : d.artistId,
      }));
      setSheets(data);
    } catch (err: any) {
      console.error('Error fetching sheets:', err);
      setError(err?.message || t('fetchGenericError'));
    } finally {
      setLoading(false);
    }
  };

  // ----- 딥링크 동기화 -----

  // 카드/버튼 클릭 시 호출. URL 도 함께 갱신해서 공유 가능한 상태로 만듭니다.
  const openSheet = useCallback((sheet: Sheet, options: { updateUrl?: boolean } = { updateUrl: true }) => {
    setPreviewSheet(sheet);
    if (options.updateUrl && typeof window !== 'undefined') {
      const next = `/sheets/${sheet.id}`;
      if (window.location.pathname !== next) {
        window.history.pushState({ sheetId: sheet.id }, '', next);
      }
    }
  }, []);

  const closeSheet = useCallback(() => {
    setPreviewSheet(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/sheets') {
      window.history.pushState({}, '', '/sheets');
    }
  }, []);

  // 최초 마운트: initialSheetId 또는 ?sheetId= 쿼리로 자동 오픈
  useEffect(() => {
    if (sheets.length === 0 || previewSheet) return;

    let targetId: string | undefined = initialSheetId;
    if (!targetId && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      targetId = params.get('sheetId') || params.get('id') || undefined;
      if (targetId) {
        // 구버전 쿼리 진입이라면 정규 경로로 교체
        window.history.replaceState({ sheetId: targetId }, '', `/sheets/${targetId}`);
      }
    }
    if (!targetId) return;

    const target = sheets.find((s) => s.id === targetId);
    if (target) {
      setPreviewSheet(target);
    }
  }, [sheets, previewSheet, initialSheetId]);

  // 브라우저 뒤로/앞으로 가기와 모달 열림 상태 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onPopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/sheets\/(.+?)\/?$/);
      if (match) {
        const id = match[1];
        const target = sheets.find((s) => s.id === id);
        setPreviewSheet(target ?? null);
      } else {
        setPreviewSheet(null);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [sheets]);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(
      sheets.flatMap(sheet =>
        (sheet.moodTags || [])
      )
    )
  );

  // Normalize search term as well just to be safe
  const normalizedSearchTerm = searchTerm.normalize('NFC');

  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(normalizedSearchTerm.toLowerCase()) ||
                          (sheet.artistId && sheet.artistId.toLowerCase().includes(normalizedSearchTerm.toLowerCase()));
    const matchesTag = selectedTag ? (sheet.moodTags || []).includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  // 연결된 음원 재생 (현재 미사용이지만 추후 카드/모달에서 호출하기 위해 보존)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePlayLinkedMusic = async (albumId: string, trackId: string) => {
    try {
      const album = await getDocById<MusicAlbum>('albums', albumId);
      if (album) {
        useMusicStore.getState().openAlbumModal(album, 'ko');
        const track = album.tracks?.find(tk => tk.id === trackId) || album.tracks?.[0];
        if (track) {
          useMusicStore.getState().setActiveTrack(track);
          useMusicStore.getState().setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error(e);
      alert(t('loadMusicFailed'));
    }
  };

  const handleFavoriteToggle = (sheetId: string, nextFavorited: boolean) => {
    setFavoriteSheetIds((prev) => {
      if (nextFavorited) {
        return prev.includes(sheetId) ? prev : [...prev, sheetId];
      }

      return prev.filter((id) => id !== sheetId);
    });
  };

  return (
    <div className="flex-1 bg-[#0A0A0A] text-[#F4F4F5] pt-12 md:pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E6C79C] to-[#C9A675] mb-4">
              {t('galleryTitle')}
            </h1>
            <p className="text-lg text-[#A1A1AA] max-w-2xl">
              {t('gallerySubtitle')}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-[#A1A1AA]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === null
                  ? 'bg-[#E6C79C] text-black'
                  : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {t('filterAll')}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-[#E6C79C] text-black'
                    : 'bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#E6C79C] border-t-transparent animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/10 rounded-3xl border border-red-500/20">
            <h3 className="text-xl font-bold text-red-500 mb-2">{t('loadError')}</h3>
            <p className="text-red-400 max-w-md mx-auto">{error}</p>
          </div>
        ) : filteredSheets.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Music className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">{t('notFoundTitle')}</h3>
            <p className="text-[#A1A1AA]">{t('notFoundHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSheets.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => openSheet(sheet)}
                className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(230,199,156,0.1)] hover:-translate-y-1 flex flex-col pt-1"
              >
                {/* Thumbnail Area — 게스트의 프리미엄 카드만 하단 부분 블러, 로그인 시 선명 */}
                <div className="aspect-[4/5] relative bg-[#0A0A0A] overflow-hidden m-4 rounded-xl border border-white/5 flex items-center justify-center">
                  {sheet.thumbnailUrl ? (
                    <>
                      <img
                        src={sheet.thumbnailUrl}
                        alt={sheet.title}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          WebkitUserDrag: 'none',
                          WebkitTouchCallout: 'none',
                        } as React.CSSProperties}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                      {sheet.isPremiumOnly && !user && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            maskImage: 'linear-gradient(to bottom, transparent 45%, black 82%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 45%, black 82%)',
                          } as React.CSSProperties}
                        />
                      )}
                    </>
                  ) : sheet.youtubeId ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${sheet.youtubeId}/hqdefault.jpg`}
                        alt={sheet.title}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                          <PlayCircle className="w-6 h-6 text-[#E6C79C] fill-[#E6C79C]/20" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-12 h-12 text-white/10" />
                    </div>
                  )}

                  {/* Category/Level Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {sheet.isPremiumOnly && (
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-[#E6C79C] text-black rounded-full shadow-lg">
                        Premium
                      </span>
                    )}
                  </div>
                  {/* 즐겨찾기 하트 */}
                  <div className="absolute top-3 right-3">
                    <FavoriteButton
                      sheet={sheet}
                      size={18}
                      isFavorited={favoriteSheetIds.includes(sheet.id)}
                      onToggle={(nextFavorited) => handleFavoriteToggle(sheet.id, nextFavorited)}
                    />
                  </div>
                </div>

                {/* Content Area */}
                <div className="px-6 pb-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-2xl md:text-3xl text-white mb-1 line-clamp-1 tracking-normal leading-tight group-hover:text-[#E6C79C] transition-colors font-handwriting">
                      {sheet.title}
                    </h3>
                    <p className="text-[#A1A1AA] text-sm flex items-center gap-1 font-medium">
                      <Music className="w-3.5 h-3.5" /> {sheet.artistId || t('unknownArtist')}
                    </p>
                  </div>

                  {/* Indicators (잠긴 sheet도 파일 존재 여부 표시) */}
                  <div className="flex gap-2 mb-4">
                    {(sheet.hasPdf ?? Boolean(sheet.pdfUrl)) && <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-bold">{t('badgePdf')}</span>}
                    {(sheet.hasAudio ?? Boolean(sheet.audioUrl)) && <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">{t('badgeAudio')}</span>}
                  </div>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {sheet.bpm && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 text-[#A1A1AA]">
                        <Activity className="w-3 h-3 text-[#E6C79C]" /> {sheet.bpm} BPM
                      </span>
                    )}
                    {sheet.key && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white/5 text-[#A1A1AA]">
                        <Hash className="w-3 h-3 text-[#E6C79C]" /> {sheet.key}
                      </span>
                    )}
                  </div>

                  {/* Footer & Action */}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-white">
                        {sheet.price === '0' || sheet.price === '' || !sheet.price ? t('free') : `$${sheet.price}`}
                      </span>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSheet(sheet);
                      }}
                      className="bg-[#E6C79C] text-black hover:bg-[#C9A675] rounded-full px-5 transition-all text-sm font-black shadow-lg shadow-[#E6C79C]/20"
                    >
                      {t('details')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {previewSheet && (
        <SheetModal
          sheet={previewSheet}
          onClose={closeSheet}
          theme="dark"
        />
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
