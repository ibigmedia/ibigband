import React from 'react';
import { Music, PlayCircle, FileText, Download, X, Activity, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMusicStore } from '@/store/useMusicStore';
import { MusicAlbum } from '@/types/music';
import { getDocById } from '@/lib/firebase/firestore';
import { Sheet } from '@/types/sheet';

interface SheetModalProps {
  sheet: Sheet;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function SheetModal({ sheet, onClose, theme = 'dark' }: SheetModalProps) {
  const isLight = theme === 'light';

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
            <h2 className={`text-3xl md:text-4xl ${t.textMain} line-clamp-1 tracking-normal font-handwriting`}>{sheet.title}</h2>
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
          
          {/* Large Sheet Preview at Top */}
          {sheet.thumbnailUrl && (
            <div className={`w-full ${t.previewBg} border-b ${t.borderColor} relative flex justify-center items-center overflow-hidden py-10 px-4 min-h-[40vh] md:min-h-[60vh]`}>
              <img 
                src={sheet.thumbnailUrl} 
                alt={sheet.title} 
                className="max-w-full lg:max-w-4xl max-h-[70vh] object-contain shadow-2xl border border-black/5" 
              />
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
                  <div className={`bg-black border ${t.borderColor} rounded-2xl overflow-hidden shadow-lg`}>
                    <div className={`px-4 py-3 ${isLight ? 'bg-[#2D2926]' : 'bg-[#1A1A1A]'} border-b ${t.borderColor} flex items-center gap-2`}>
                        <PlayCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">영상 미리보기</span>
                    </div>
                    <div className="aspect-video w-full relative">
                        <iframe
                          src={`https://www.youtube.com/embed/${sheet.youtubeId}?rel=0`}
                          title="YouTube Preview"
                          frameBorder="0"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        ></iframe>
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
                  <Button 
                    disabled={!sheet.pdfUrl}
                    onClick={() => window.open(sheet.pdfUrl, '_blank')} 
                    className={`w-full sm:w-auto mt-4 sm:mt-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/30 rounded-xl px-6 py-4 sm:py-2 transition-colors font-bold flex gap-2 ${!sheet.pdfUrl && 'opacity-50'}`}
                  >
                      {sheet.pdfUrl ? <><Download className="w-5 h-5 sm:w-4 sm:h-4"/> 열기 / 저장</> : '준비 중'}
                  </Button>
                </div>

                {/* MR Audio Box */}
                <div className={`${t.boxBg} p-6 rounded-2xl border-l-4 ${isLight ? 'border' : 'border-[#1A1A1A]'} border-l-blue-500 shadow-lg ${isLight ? 'border-[#78716A]/15' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex shrink-0 items-center justify-center">
                        <Music className="w-8 h-8 text-blue-500"/>
                    </div>
                    <div className="flex-1">
                        <h4 className={`${t.textMain} font-bold text-lg mb-1`}>MR 반주 음원</h4>
                        <p className={`text-xs ${t.textMuted}`}>다운로드 가능한 고음질 반주 음원</p>
                    </div>
                    <Button 
                      disabled={!sheet.audioUrl}
                      onClick={() => {
                        if(sheet.audioUrl) {
                          const a = document.createElement('a');
                          a.href = sheet.audioUrl;
                          a.download = `${sheet.title}_MR.mp3`;
                          a.target = '_blank';
                          a.click();
                        }
                      }}
                      className={`w-full sm:w-auto mt-4 sm:mt-0 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl px-6 py-4 sm:py-2 transition-colors font-bold flex gap-2 ${!sheet.audioUrl && 'opacity-50'}`}
                    >
                        {sheet.audioUrl ? <><Download className="w-5 h-5 sm:w-4 sm:h-4"/> 소스 다운로드</> : '준비 중'}
                    </Button>
                  </div>

                  {/* Explicit Audio Player for MR */}
                  {sheet.audioUrl && (
                    <div className={`${t.contentBg} border ${t.borderColor} p-4 rounded-xl mt-4`}>
                      <audio controls className="w-full h-12 outline-none" controlsList="nodownload">
                        <source src={sheet.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
