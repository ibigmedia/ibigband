import re

with open('src/components/music/GlobalMusicPlayer.tsx', 'r') as f:
    text = f.read()

# I will replace the modal block
# From: {/* ALBUM MODAL OVERLAY */}
# To: {/* MINI PLAYER */}

new_modal = """
      {/* ALBUM MODAL OVERLAY */}
      {selectedAlbum && activeTrack && currentVersion && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center md:pt-16 pb-0 md:p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeAlbumModal}
        >
          <div 
            className="w-full h-full max-w-[1280px] bg-white md:rounded-[40px] relative overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-500 transform-gpu"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Close Modal Button */}
             <button 
               onClick={closeAlbumModal}
               className="absolute top-4 right-4 z-50 w-10 h-10 md:w-12 md:h-12 bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:bg-slate-100 text-slate-800 rounded-full flex justify-center items-center transition-all duration-300"
             >
               <X className="w-5 h-5" />
             </button>

             {/* Modal Content - Scrollable on mobile, flex-row on desktop */}
             <div className="flex flex-col lg:flex-row w-full h-full overflow-y-auto lg:overflow-hidden">
                
                {/* LEFT: Album Info and Tracks (Mobile: Stacked, Desktop: Split or single col) */}
                {/* Making it 2 columns on lg, 1 column on md */}
                <div className="lg:w-5/12 flex flex-col md:flex-row lg:flex-col bg-[#FDFCFB] border-b lg:border-b-0 lg:border-r border-slate-100 relative shrink-0 h-auto lg:h-full">
                   <div className="flex flex-col w-full h-full lg:overflow-y-auto hide-scrollbar">
                      
                      {/* Album Info Section */}
                      <div className="p-6 md:p-8 flex flex-col sm:flex-row lg:flex-col gap-6 items-start">
                         <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-full lg:max-w-[220px] aspect-square rounded-[24px] overflow-hidden shadow-lg relative shrink-0 mx-auto sm:mx-0">
                            <Image src={selectedAlbum.coverUrl} alt={selectedAlbum.title} fill className="object-cover" sizes="(max-width: 768px) 128px, 220px" />
                         </div>
                         <div className="flex-1 text-center sm:text-left lg:text-left flex flex-col w-full">
                            <span className="text-[#C48C5E] text-[10px] font-bold uppercase tracking-widest block mb-1.5 border border-[#C48C5E]/30 bg-[#C48C5E]/5 px-2 py-0.5 rounded-full w-max mx-auto sm:mx-0">
                               {selectedAlbum.type}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-handwriting text-slate-900 leading-tight mb-2">{selectedAlbum.title}</h2>
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 md:line-clamp-none">{selectedAlbum.description}</p>
                         </div>
                      </div>

                      {/* Tracklist Section */}
                      <div className="px-4 md:px-8 pb-6 flex-1">
                         <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Tracklist</h3>
                         <div className="flex flex-col gap-1">
                            {selectedAlbum.tracks.map((track, i) => {
                              const isActive = activeTrack.id === track.id;
                              return (
                                <div 
                                  key={track.id} 
                                  onClick={() => handleTrackSelect(track)}
                                  className={`flex items-center gap-3 py-2 px-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                                    isActive 
                                      ? 'bg-[#C48C5E] text-white shadow-md transform scale-[1.02]' 
                                      : 'hover:bg-white text-slate-700 hover:shadow-sm border border-transparent hover:border-slate-100'
                                  }`}
                                >
                                   <div className={`w-5 text-center font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                     {isActive && isPlaying ? <Play className="w-4 h-4 mx-auto fill-current animate-pulse"/> : `${i+1}`}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className={`font-handwriting font-normal text-xl md:text-2xl leading-none truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{track.title?.normalize('NFC') || track.title}</p>
                                      {track.versions.length > 1 && !isActive && (
                                         <p className="text-[10px] text-slate-400 md:font-medium mt-1">{track.versions.length} versions</p>
                                      )}
                                   </div>
                                   <div className={`text-xs font-medium pl-2 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{track.duration}</div>
                                </div>
                              )
                            })}
                         </div>
                      </div>

                      {/* Credits Section */}
                      <div className="mx-4 md:mx-8 mb-8 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shrink-0">
                         <div className="flex items-center gap-2 mb-4 text-[#C48C5E]">
                            <Users className="w-4 h-4"/>
                            <h3 className="text-sm font-bold uppercase tracking-widest">Credits</h3>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            {activeTrack.credits.composer && (
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Words & Music</span>
                                  <span className="text-slate-800 text-sm font-medium">{activeTrack.credits.composer}</span>
                               </div>
                            )}
                            {currentVersion.vocal && (
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1"><Mic2 className="w-3 h-3"/> Vocals</span>
                                  <span className="text-slate-800 text-sm font-medium">{currentVersion.vocal}</span>
                               </div>
                            )}
                            {activeTrack.credits.arranger && (
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Arrangement</span>
                                  <span className="text-slate-800 text-sm font-medium">{activeTrack.credits.arranger}</span>
                               </div>
                            )}
                            {activeTrack.credits.producer && (
                               <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1 mt-1">
                                  <span className="text-[10px] text-[#C48C5E] uppercase font-bold tracking-widest flex items-center gap-1"><Disc className="w-3 h-3"/> Executive Producer</span>
                                  <span className="text-[#C48C5E] text-sm font-bold">{activeTrack.credits.producer}</span>
                               </div>
                            )}
                         </div>
                      </div>

                   </div>
                </div>

                {/* RIGHT: Now Playing & Lyrics */}
                <div className="lg:w-7/12 flex flex-col lg:h-full relative overflow-hidden bg-white z-10">
                   <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
                      <Image src={selectedAlbum.coverUrl} alt="bg" fill className="object-cover blur-[80px]" />
                   </div>
                   
                   {/* Now Playing Header (Sticky on mobile) */}
                   <div className="sticky top-0 z-30 px-6 py-5 md:px-10 md:py-8 bg-white/95 backdrop-blur-xl border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6 shadow-sm lg:shadow-none">
                      <div className="flex-1 min-w-0 pr-8">
                         <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[#C48C5E] font-bold tracking-widest text-[10px] uppercase">Now Playing</span>
                            <span className="hidden lg:flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                               <kbd className="font-sans font-bold border border-slate-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.1)] px-1.5 pb-[1px] bg-white text-slate-600 leading-none">Space</kbd>
                               스페이스바로 재생
                            </span>
                         </div>
                         <h2 className="text-slate-900 text-4xl md:text-5xl line-clamp-2 leading-tight font-handwriting font-normal">{currentVersion.title.normalize('NFC')}</h2>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap pb-2 md:pb-0">
                         {activeTrack.versions.length > 1 && (
                           <div className="flex bg-slate-100 p-1.5 rounded-2xl relative shadow-inner">
                             <div className="absolute inset-y-1.5 bg-white rounded-[10px] shadow-sm transition-all duration-300" style={{
                                width: `calc(100% / ${activeTrack.versions.length} - 12px)`,
                                left: `calc((100% / ${activeTrack.versions.length}) * ${activeTrack.versions.findIndex(v => v.lang === activeLang)} + 6px)`
                             }}></div>
                             {activeTrack.versions.map((ver) => (
                               <button
                                 key={ver.lang}
                                 onClick={() => {
                                   setActiveLang(ver.lang);
                                   setProgress(0);
                                 }}
                                 className={`relative z-10 px-4 py-2 flex items-center gap-2 rounded-[10px] text-xs font-bold transition-all duration-300 ${
                                   activeLang === ver.lang ? 'text-[#C48C5E]' : 'text-slate-500 hover:text-slate-800'
                                 }`}
                               >
                                  {activeLang === ver.lang && <Languages className="w-4 h-4"/>}
                                  {langNames[ver.lang]}
                               </button>
                             ))}
                           </div>
                         )}
                         
                         <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100 ml-auto md:ml-2 hidden sm:flex">
                            <button onClick={() => setLyricsScale(Math.max(0.6, lyricsScale - 0.2))} className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-[10px] transition-colors">A-</button>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <button onClick={() => setLyricsScale(Math.min(2.0, lyricsScale + 0.2))} className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-[10px] transition-colors">A+</button>
                         </div>

                         <button 
                           onClick={togglePlay}
                           className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#C48C5E] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#C48C5E]/30 shrink-0"
                         >
                           {isPlaying ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-1" />}
                         </button>
                      </div>
                   </div>
                   
                   <div className="relative z-30 w-full h-1 bg-slate-100">
                      <div className="h-full bg-[#C48C5E] transition-all duration-300 ease-linear rounded-r-full" style={{ width: `${progress}%` }}></div>
                   </div>

                   {/* Lyrics Text */}
                   <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-6 md:p-10 lg:p-14 pb-32 mask-image-y min-h-[300px]">
                      <div 
                        className="text-slate-800 font-handwriting font-normal tracking-wide antialiased transition-all duration-300 transform-gpu"
                        style={{ 
                           fontSize: `calc(${1.2 * lyricsScale}rem + 0.8vw)`, 
                           lineHeight: 1.25
                        }}
                      >
                        {renderLyrics(currentVersion.lyrics)}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
"""

pattern = re.compile(r'\{\/\* ALBUM MODAL OVERLAY \*\/\}.*?\{\/\* MINI PLAYER \*\/\}', re.DOTALL)
new_content = pattern.sub(new_modal + '\n      {/* MINI PLAYER */}', text)

with open('src/components/music/GlobalMusicPlayer.tsx', 'w') as f:
    f.write(new_content)

print("Modal UI updated")
