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
}
