export interface Sheet {
  id: string;
  title: string;
  artistId?: string;
  youtubeId?: string;
  pdfUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  bpm?: number | string;
  key?: string;
  moodTags?: string[];
  isPremiumOnly?: boolean;
  price?: string;
  albumId?: string;
  trackId?: string;
  createdAt: number;
  // /api/sheets/list 가 동봉하는 파일 보유 여부. 프리미엄 잠금으로 pdfUrl/audioUrl이 마스킹돼도
  // 카드 인디케이터를 표시하기 위해 사용합니다.
  hasPdf?: boolean;
  hasAudio?: boolean;
}
