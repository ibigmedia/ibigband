import React from 'react';
import { useRouter } from 'next/navigation';
import { Music, PlayCircle, FileText, Download, X, Activity, Hash, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMusicStore } from '@/store/useMusicStore';
import { MusicAlbum } from '@/types/music';
import { getDocById } from '@/lib/firebase/firestore';
import { Sheet } from '@/types/sheet';
import FavoriteButton from '@/components/sheets/FavoriteButton';
import { useAuth } from '@/lib/firebase/auth';

interface SheetModalProps {
  sheet: Sheet;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function SheetModal({ sheet, onClose, theme = 'dark' }: SheetModalProps) {
  const isLight = theme === 'light';
  const router = useRouter();
  const { user, userData } = useAuth();

  // 프리미엄 접근 가능 조건: 로그인 + (프리미엄 결제 || 밴드멤버 이상 || 관리자)
  const canAccessPremium = Boolean(
    user && (
      userData?.isPremium ||
      userData?.grade === 'member' ||
      userData?.grade === 'admin' ||
      userData?.role === 'admin'
    )
  );
  const isLocked = Boolean(sheet.isPremiumOnly) && !canAccessPremium;
  const lockReason: 'login' | 'upgrade' = !user ? 'login' : 'upgrade';

  // Theme color mappings
  const t = {
    overlay: isLight ? 'bg-black/60' : 'bg-black/90',
    modalBg: isLight ? 'bg-[#FAF9F6]' : 'bg-[#0F0F0F]',
    borderColor: isLight ? 'border-[#78716A]/15' : 'border-[#27272A]',
    modalHeaderBorder: isLight ? 'border-[#78716A]/10' : 'border-[#27272A]',
    textMain: isLight ? 'text-[#2D2926]' : 'text-white',
    textMuted: isLight ? 'text-[#78716A]' : 'text-[#A1A1AA]',
    textSubMuted: isLight ? 'text-gray-500' : 'text-[#71717A]',
    btnCloseBg: isLight ? 'hover:bg-[#78716A]/10 text-[#78716A]' : 'bg-[#27272A] hover:bg-[#3F3F46] text-white',
    contentBg: isLight ? 'bg-white' : 'bg-[#0A0A0A]',
    previewBg: isLight ? 'bg-[#F5F5F3]' : 'bg-[#141414]',
    boxBg: isLight ? 'bg-white' : 'bg-[#1A1A1A]',
    tagBg: isLight ? 'bg-[#78716A]/5' : 'bg-[#27272A]',
    tagBorder: isLight ? 'border-[#78716A]/10' : 'border-[#3F3F46]',
    tagHover: isLight ? 'hover:text-[#2D2926]' : 'hover:text-white',
  };

  // 서버 측 등급 검증을 거쳐 PDF 다운로드 URL을 받아옵니다. 음원은 다운로드를 제공하지 않습니다.
  const handleDownloadPdf = async () => {
    try {
      const headers: Record<string, string> = {};
      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (e) {
          console.warn('ID 토큰 발급 실패:', e);
        }
      }
      const res = await fetch(`/api/sheets/${sheet.id}/download?type=pdf`, { headers, cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          alert(body?.reason === 'login'
            ? '로그인이 필요한 프리미엄 악보입니다.'
            : '프리미엄 멤버십이 필요한 악보입니다.');
        } else if (res.status === 404) {
          alert(body?.error || '파일이 등록되어 있지 않습니다.');
        } else {
          alert(body?.error || '다운로드 링크를 가져오지 못했습니다.');
        }
        return;
      }
      if (body?.url) window.open(body.url, '_blank');
    } catch (e) {
      console.error('다운로드 요청 실패:', e);
      alert('다운로드 요청에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handlePlayLinkedMusic = async (albumId: string, trackId: string) => {
    try {
      const album = await getDocById<MusicAlbum>('albums', albumId);
      if (album) {
        useMusicStore.getState().openAlbumModal(album, 'ko');
        const track = album.tracks?.find(t => t.id === trackId) || album.tracks?.[0];
        if (track) {
          useMusicStore.getState().setActiveTrack(track);
          useMusicStore.getState().setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error(e);
      alert('음원을 불러오는데 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
      <div 
        className={`absolute inset-0 ${t.overlay} backdrop-blur-md`}
        onClick={onClose}
      ></div>
      <div className={`relative ${t.modalBg} border ${t.borderColor} w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200`}>
        {/* Modal Header */}
        <div className={`flex justify-between items-center p-4 md:p-6 border-b ${t.modalHeaderBorder} shrink-0`}>
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#E6C79C] uppercase mb-1 block">상세 보기</span>
            <div className="flex items-center gap-3">
              <h2 className={`text-3xl md:text-4xl ${t.textMain} line-clamp-1 tracking-normal font-handwriting`}>{sheet.title}</h2>
              <FavoriteButton sheet={sheet} size={22} />
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ml-4 ${t.btnCloseBg}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Content - Scrolling Area */}
        <div className={`overflow-y-auto flex-1 custom-scrollbar ${t.contentBg}`}>
          
          {/* Large Sheet Preview at Top — 프리미엄은 블러 + 우클릭/드래그/저장 차단 */}
          {sheet.thumbnailUrl && (
            <div className={`w-full ${t.previewBg} border-b ${t.borderColor} relative flex justify-center items-center overflow-hidden py-10 px-4 min-h-[40vh] md:min-h-[60vh]`}>
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
                  filter: isLocked ? 'blur(18px) saturate(0.85)' : undefined,
                  transform: isLocked ? 'scale(1.05)' : undefined, // blur 가장자리 가림
                } as React.CSSProperties}
                className="max-w-full lg:max-w-4xl max-h-[70vh] object-contain shadow-2xl border border-black/5 transition-all"
              />
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="bg-black/55 backdrop-blur-sm border border-brand-gold/50 rounded-2xl px-6 py-5 flex flex-col items-center gap-3 max-w-sm text-center pointer-events-auto">
                    <Lock className="w-7 h-7 text-brand-gold" />
                    <p className="text-white font-bold text-base">프리미엄 전용 미리보기</p>
                    <p className="text-white/80 text-xs leading-relaxed">
                      멤버십 가입 후 전체 악보를 선명하게 볼 수 있고,<br/>PDF로도 다운로드할 수 있습니다.
                    </p>
                    <Button
                      onClick={() => { onClose(); router.push(lockReason === 'login' ? '/login' : '/premium'); }}
                      className="mt-1 bg-brand-gold text-black hover:bg-[#C9A675] rounded-xl px-4 py-2 text-sm font-bold"
                    >
                      {lockReason === 'login' ? '로그인하기' : '멤버십 알아보기'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4">
              {/* Left Column: Info */}
              <div className="w-full lg:w-[320px] shrink-0 space-y-6">
                {/* Meta Basic Info */}
                <div className={`${t.boxBg} p-6 rounded-2xl border ${t.borderColor} ${isLight ? 'shadow-sm' : ''}`}>
                  <h3 className={`text-sm font-bold ${t.textMuted} uppercase tracking-wider mb-4 border-b ${t.borderColor} pb-2`}>기본 정보</h3>
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={`${t.textSubMuted} text-sm`}>아티스트/편곡자</span>
                        <span className={`${t.textMain} font-medium`}>{sheet.artistId || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${t.textSubMuted} text-sm`}>BPM</span>
                        <span className={`${t.textMain} font-medium`}>{sheet.bpm || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${t.textSubMuted} text-sm`}>Key</span>
                        <span className={`${t.textMain} font-medium`}>{sheet.key || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${t.textSubMuted} text-sm`}>가격</span>
                        <span className="text-[#E6C79C] font-black tracking-wider">{sheet.price === '0' || !sheet.price ? '무료' : `$${sheet.price}`}</span>
                      </div>
                  </div>
                  
                  {sheet.moodTags && sheet.moodTags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {sheet.moodTags.map(tag => (
                          <span key={tag} className={`px-3 py-1.5 ${t.tagBg} ${t.textMuted} rounded-md text-xs font-medium border ${t.tagBorder} ${t.tagHover} transition-colors cursor-default`}>#{tag.trim()}</span>
                        ))}
                      </div>
                  )}
                </div>

                {/* Play Linked Audio */}
                {sheet.albumId && sheet.trackId && (
                    <div className={`${t.boxBg} p-6 rounded-2xl border ${t.borderColor} text-center ${isLight ? 'shadow-sm' : ''}`}>
                      <div className="w-12 h-12 bg-[#E6C79C]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E6C79C]/20">
                        <Music className="w-6 h-6 text-[#E6C79C]"/>
                      </div>
                      <h4 className={`${t.textMain} font-bold mb-2`}>공식 음원 연결됨</h4>
                      <p className={`text-xs ${t.textMuted} mb-4`}>음반 페이지와 연동되어<br/>이 곡의 반주 및 가사를 들을 수 있습니다.</p>
                      <Button 
                        onClick={() => {
                          onClose();
                          handlePlayLinkedMusic(sheet.albumId!, sheet.trackId!);
                        }}
                        className="w-full bg-[#E6C79C] text-[#2D2926] hover:bg-[#C9A675] font-bold py-3 lg:py-4 tracking-wide shadow-lg shadow-[#E6C79C]/20 border-none"
                      >
                        <PlayCircle className="w-5 h-5 mr-2"/>
                        연결된 음원 재생하기
                      </Button>
                    </div>
                )}
              </div>

              {/* Right Column: Files & Playback */}
              <div className="flex-1 min-w-0 space-y-6">
                {/* YouTube Preview */}
                {sheet.youtubeId && (
                  <div className={`bg-black border ${t.borderColor} rounded-2xl overflow-hidden shadow-lg mb-6`}>
                    <div className={`px-4 py-3 ${isLight ? 'bg-[#2D2926]' : 'bg-[#1A1A1A]'} border-b ${t.borderColor} flex items-center gap-2`}>
                        <PlayCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">영상 미리보기</span>
                    </div>
                    <div className="aspect-video w-full relative">
                        <iframe
                          src={`https://www.youtube.com/embed/${sheet.youtubeId}?autoplay=1&playsinline=1&rel=0`}
                          title="YouTube Preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        ></iframe>
                    </div>
                  </div>
                )}

                {/* 프리미엄 잠금 안내 (게스트/비프리미엄) — 악보(PDF/미리보기 이미지)만 잠기며 음원은 참조용으로 들을 수 있습니다. */}
                {isLocked && (
                  <div className={`${t.boxBg} p-6 rounded-2xl border-l-4 border-l-brand-gold ${isLight ? 'border border-brand-taupe/15' : 'border-[#1A1A1A]'} shadow-lg`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-gold/15 flex shrink-0 items-center justify-center border border-brand-gold/30">
                        <Lock className="w-5 h-5 text-brand-gold" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`${t.textMain} font-bold text-lg mb-1`}>프리미엄 전용 악보입니다</h4>
                        <p className={`text-sm ${t.textMuted} mb-4 leading-relaxed`}>
                          {lockReason === 'login'
                            ? '악보(PDF·미리보기 이미지)는 로그인 후 프리미엄 멤버십 또는 밴드 멤버 등급에서 이용할 수 있습니다. 음원은 참조용으로 자유롭게 들을 수 있습니다.'
                            : '악보(PDF·미리보기 이미지)를 보려면 프리미엄 멤버십 또는 밴드 멤버 등급이 필요합니다. 음원은 참조용으로 자유롭게 들을 수 있습니다.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {lockReason === 'login' ? (
                            <>
                              <Button
                                onClick={() => { onClose(); router.push('/login'); }}
                                className="bg-brand-gold text-black hover:bg-[#C9A675] rounded-xl px-5 py-2 font-bold"
                              >
                                로그인
                              </Button>
                              <Button
                                onClick={() => { onClose(); router.push('/premium'); }}
                                className="bg-transparent border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 rounded-xl px-5 py-2 font-bold"
                              >
                                멤버십 알아보기
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => { onClose(); router.push('/premium'); }}
                              className="bg-brand-gold text-black hover:bg-[#C9A675] rounded-xl px-5 py-2 font-bold"
                            >
                              멤버십 자세히 보기
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Sheet Box */}
                <div className={`${t.boxBg} p-6 rounded-2xl border-l-4 ${isLight ? 'border' : 'border-[#1A1A1A]'} border-l-green-500 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-6 ${isLight ? 'border-[#78716A]/15' : ''}`}>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex shrink-0 items-center justify-center">
                      <FileText className="w-8 h-8 text-green-500"/>
                  </div>
                    <div className="flex-1">
                      <h4 className={`${t.textMain} font-bold text-lg mb-1`}>PDF 악보</h4>
                      <p className={`text-xs ${t.textMuted}`}>인쇄 가능한 고화질 악보 파일</p>
                  </div>
                  {isLocked ? (
                    <Button
                      onClick={() => { onClose(); router.push(lockReason === 'login' ? '/login' : '/premium'); }}
                      className="w-full sm:w-auto mt-4 sm:mt-0 bg-brand-gold/15 text-[#C9A675] hover:bg-brand-gold/25 border border-brand-gold/40 rounded-xl px-6 py-4 sm:py-2 transition-colors font-bold flex gap-2"
                    >
                      <Lock className="w-5 h-5 sm:w-4 sm:h-4"/> 프리미엄 전용
                    </Button>
                  ) : (
                    <Button
                      disabled={!sheet.pdfUrl && !sheet.hasPdf}
                      onClick={handleDownloadPdf}
                      className={`w-full sm:w-auto mt-4 sm:mt-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/30 rounded-xl px-6 py-4 sm:py-2 transition-colors font-bold flex gap-2 ${(!sheet.pdfUrl && !sheet.hasPdf) && 'opacity-50'}`}
                    >
                      {(sheet.pdfUrl || sheet.hasPdf) ? <><Download className="w-5 h-5 sm:w-4 sm:h-4"/> 열기 / 저장</> : '준비 중'}
                    </Button>
                  )}
                </div>

                {/* 음원 듣기 — 잠금 무관 누구나 재생 가능, 다운로드는 제공하지 않습니다. */}
                {(sheet.audioUrl || sheet.hasAudio) && (
                  <div className={`${t.boxBg} p-6 rounded-2xl border-l-4 ${isLight ? 'border' : 'border-[#1A1A1A]'} border-l-blue-500 shadow-lg ${isLight ? 'border-[#78716A]/15' : ''}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-500/10 flex shrink-0 items-center justify-center">
                          <Music className="w-8 h-8 text-blue-500"/>
                      </div>
                      <div className="flex-1">
                          <h4 className={`${t.textMain} font-bold text-lg mb-1`}>음원 듣기</h4>
                          <p className={`text-xs ${t.textMuted}`}>참조용 음원입니다. (별도 저장은 제공되지 않습니다)</p>
                      </div>
                    </div>

                    {sheet.audioUrl && (
                      <div className={`${t.contentBg} border ${t.borderColor} p-4 rounded-xl mt-2`}>
                        <audio
                          controls
                          className="w-full h-12 outline-none"
                          controlsList="nodownload noplaybackrate"
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          <source src={sheet.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
