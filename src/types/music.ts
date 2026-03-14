export type TrackCredit = {
  composer?: string;
  arranger?: string;
  instruments?: string;
  producer?: string;
};

export type TrackVersion = {
  lang: 'ko' | 'en' | 'es';
  title: string;
  audioUrl: string;
  lyrics: string;
  vocal?: string;
};

export type Track = {
  id: string;
  title: string;
  duration: string;
  credits: TrackCredit;
  versions: TrackVersion[];
};

export type MusicAlbum = {
  id?: string;
  type: 'Single' | 'EP' | 'Album';
  title: string;
  coverUrl: string;
  releaseDate: string;
  description: string;
  tracks: Track[];
  createdAt?: number;
};
