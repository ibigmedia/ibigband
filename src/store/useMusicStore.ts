import { create } from 'zustand';
import { MusicAlbum, Track } from '@/types/music';

interface MusicState {
  albums: MusicAlbum[];
  selectedAlbum: MusicAlbum | null;
  activeTrack: Track | null;
  activeLang: 'ko' | 'en' | 'es';
  isPlaying: boolean;
  progress: number;
  lyricsScale: number;

  setAlbums: (albums: MusicAlbum[]) => void;
  setSelectedAlbum: (album: MusicAlbum | null) => void;
  setActiveTrack: (track: Track | null) => void;
  setActiveLang: (lang: 'ko' | 'en' | 'es') => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setProgress: (progress: number) => void;
  setLyricsScale: (scale: number) => void;

  openAlbumModal: (album: MusicAlbum, defaultLang?: 'ko' | 'en' | 'es') => void;
  closeAlbumModal: () => void;
  stopPlayback: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  albums: [],
  selectedAlbum: null,
  activeTrack: null,
  activeLang: 'ko',
  isPlaying: false,
  progress: 0,
  lyricsScale: 0.8,

  setAlbums: (albums) => set({ albums }),
  setSelectedAlbum: (album) => set({ selectedAlbum: album }),
  setActiveTrack: (track) => set({ activeTrack: track }),
  setActiveLang: (lang) => set({ activeLang: lang }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ progress }),
  setLyricsScale: (scale) => set({ lyricsScale: scale }),

  openAlbumModal: (album, defaultLang) => {
    const state = get();
    // Check if we are already playing/viewing a track from this album
    const isPlayingThisAlbum = state.activeTrack && album.tracks.some(t => t.id === state.activeTrack?.id);

    if (!isPlayingThisAlbum && state.isPlaying) {
       // Ideally we could confirm here but browser `confirm` in store is acceptable or we just override
       // If confirmation is needed, we should probably do it at component level before calling openAlbumModal,
       // However since it's an action, let's keep it simple: just play the new album.
       if (!window.confirm("현재 재생 중인 곡이 있습니다. 재생을 중지하고 새 음반을 보시겠습니까?")) {
         return;
       }
    }

    set({ selectedAlbum: album });

    if (!isPlayingThisAlbum && album.tracks.length > 0) {
      let selectedLang = defaultLang || album.tracks[0].versions[0].lang;
      if (!album.tracks[0].versions.some(v => v.lang === selectedLang)) {
        selectedLang = album.tracks[0].versions[0].lang;
      }

      set({ 
        activeTrack: album.tracks[0],
        activeLang: selectedLang,
        progress: 0,
        isPlaying: true
      });
    }
  },

  closeAlbumModal: () => {
    set({ selectedAlbum: null });
  },

  stopPlayback: () => {
    set({
      isPlaying: false,
      progress: 0,
      activeTrack: null
    });
  }
}));
