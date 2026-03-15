export interface RelatedLink {
  title: string;
  url: string;
  type: 'sheet' | 'music' | 'merch' | 'premium' | 'link';
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeUrl?: string;
  videoUrl?: string; // for direct uploads
  thumbnailUrl?: string;
  featured: boolean;
  relatedLinks?: RelatedLink[];
  createdAt: any; // Timestamp or number
}
