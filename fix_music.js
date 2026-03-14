const fs = require('fs');
let content = fs.readFileSync('src/app/music/page.tsx', 'utf8');

// 1. imports
content = content.replace(
  "import { Play, Pause, SkipForward, SkipBack, Disc, Users, Mic2, Music, ListMusic, ChevronRight, Tag } from 'lucide-react';",
  "import { Play, Pause, Disc, Users, Mic2, Music, Languages } from 'lucide-react';"
);

// 2. Types
content = content.replace(
  `type Track = {
  id: string;
  title: string;
  audioUrl: string;
  duration: string;
  lyrics: string;
  credits: TrackCredit;
};`,
  `type TrackVersion = {
  lang: 'ko' | 'en' | 'es';
  title: string;
  audioUrl: string;
  lyrics: string;
  vocal?: string;
};

type Track = {
  id: string;
  title: string;
  duration: string;
  credits: TrackCredit;
  versions: TrackVersion[];
};`
);

fs.writeFileSync('src/app/music/page.tsx', content);
