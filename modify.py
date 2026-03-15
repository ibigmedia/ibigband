import re

with open('src/components/music/GlobalMusicPlayer.tsx', 'r') as f:
    text = f.read()

# 1. Add useState
text = text.replace("import { useEffect, useRef } from 'react';", "import { useEffect, useRef, useState } from 'react';")

# 2. Add showLyricsMobile state
state_block = """  const {
"""
new_state_block = """  const [showLyricsMobile, setShowLyricsMobile] = useState(false);
  const {
"""
text = text.replace(state_block, new_state_block)

# 3. Add toggle button and logic for lyrics
lyrics_section = """                   <div className="relative z-30 w-full h-1 bg-slate-100">
                      <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full" style={{ width: `${progress}%` }}></div>
                   </div>

                   {/* Lyrics Text */}
                   <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-6 md:p-10 lg:p-14 pb-32 mask-image-y min-h-[300px]">"""

new_lyrics_section = """                   <div className="relative z-30 w-full h-1 bg-slate-100">
                      <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full" style={{ width: `${progress}%` }}></div>
                   </div>

                   {/* Mobile Lyrics Toggle */}
                   <div className="lg:hidden flex justify-center py-3 bg-white border-b border-slate-100 sticky top-[108px] md:top-[128px] z-20">
                     <button 
                       onClick={() => setShowLyricsMobile(!showLyricsMobile)}
                       className="px-6 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2"
                     >
                        {showLyricsMobile ? '가사 닫기 ▲' : '가사 보기 ▼'}
                     </button>
                   </div>

                   {/* Lyrics Text */}
                   <div className={`relative z-10 flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-6 md:p-10 lg:p-14 pb-32 mask-image-y ${!showLyricsMobile ? 'hidden lg:block' : 'block'} min-h-[300px]`}>"""
text = text.replace(lyrics_section, new_lyrics_section)

# 4. Modify marquee elements to only show title on mobile
marquee_section = """                           <div className="flex items-baseline gap-2 shrink-0">
                            <h4 className="font-handwriting text-2xl md:text-3xl font-bold text-slate-800 leading-none group-hover:text-[#C48C5E] transition-colors">{currentVersion.title?.normalize('NFC') || currentVersion.title}</h4>
                            <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C48C5E] font-bold">앨범 보기 〉</span>
                          </div>
                          {activeTrackAlbum.description && (
                             <span className="text-slate-600 text-[20px] md:text-[24px] font-handwriting leading-none shrink-0 tracking-wide mt-1">
                                {activeTrackAlbum.description?.normalize('NFC') || activeTrackAlbum.description}
                             </span>
                          )}
                          {(activeTrack.credits.composer || activeTrack.credits.arranger || activeTrack.credits.producer || currentVersion.vocal) && (
                             <span className="text-slate-500 text-[22px] md:text-[26px] font-handwriting leading-none shrink-0 tracking-wide mt-1">"""

new_marquee_section = """                           <div className="flex items-baseline gap-2 shrink-0">
                            <h4 className="font-handwriting text-2xl md:text-3xl font-bold text-slate-800 leading-none group-hover:text-[#C48C5E] transition-colors">{currentVersion.title?.normalize('NFC') || currentVersion.title}</h4>
                            <span className="text-[10px] md:text-[11px] uppercase tracking-widest text-[#C48C5E] font-bold hidden md:inline-block">앨범 보기 〉</span>
                          </div>
                          {activeTrackAlbum.description && (
                             <span className="text-slate-600 text-[20px] md:text-[24px] font-handwriting leading-none shrink-0 tracking-wide mt-1 hidden md:inline-block">
                                {activeTrackAlbum.description?.normalize('NFC') || activeTrackAlbum.description}
                             </span>
                          )}
                          {(activeTrack.credits.composer || activeTrack.credits.arranger || activeTrack.credits.producer || currentVersion.vocal) && (
                             <span className="text-slate-500 text-[22px] md:text-[26px] font-handwriting leading-none shrink-0 tracking-wide mt-1 hidden md:inline-block">"""
text = text.replace(marquee_section, new_marquee_section)

# 5. Remove media query disabling marquee on mobile
css_section = """        @media (max-width: 768px) {
          .animate-marquee {
            animation: none !important;
            transform: none !important;
          }
        }"""
text = text.replace(css_section, "")

with open('src/components/music/GlobalMusicPlayer.tsx', 'w') as f:
    f.write(text)
