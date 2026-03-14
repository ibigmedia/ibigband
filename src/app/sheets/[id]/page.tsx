'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Music, FileText, PlayCircle, Loader2, Activity, Hash, Tag as TagIcon, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SheetDetail {
  id: string;
  title: string;
  artistId: string;
  youtubeId?: string;
  bpm: string | number;
  key: string;
  moodTags: string[];
  pdfUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  level?: string;
  price?: string;
  createdAt: number;
}

export default function SheetDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchSheet = async () => {
      try {
        const docRef = doc(db, 'sheets', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          setSheet({ 
            id: snap.id, 
            ...d,
            title: d.title ? d.title.normalize('NFC') : ''
          } as SheetDetail);
        } else {
          alert('Content not found.');
          router.push('/sheets');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSheet();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-[#E6C79C]" />
      </div>
    );
  }

  if (!sheet) return null;

  return (
    <div className="flex-1 bg-[#0A0A0A] text-[#F4F4F5] pt-10 pb-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-[#A1A1AA] hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Back to Gallery
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
          {/* Cover/Thumbnail */}
          <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
            {sheet.thumbnailUrl ? (
              <img src={sheet.thumbnailUrl} alt={sheet.title} className="w-full h-full object-cover" />
            ) : sheet.youtubeId ? (
              <img src={`https://img.youtube.com/vi/${sheet.youtubeId}/maxresdefault.jpg`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#A1A1AA]">
                <LayoutGrid className="w-16 h-16 mb-4 opacity-50" />
                <span className="text-sm font-bold tracking-widest uppercase">No Cover Focus</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            {sheet.level && (
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider bg-[#E6C79C]/10 text-[#E6C79C] border border-[#E6C79C]/30 rounded-full">
                Level: {sheet.level}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
              {sheet.title}
            </h1>
            <p className="text-xl text-[#A1A1AA] flex items-center gap-2 mb-6">
              <Music className="w-5 h-5" /> {sheet.artistId || 'Unknown Artist'}
            </p>

            {/* Tags/Metadata */}
            <div className="flex flex-wrap gap-3 mb-8">
              {sheet.bpm && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Activity className="w-4 h-4 text-[#E6C79C]" />
                  <span className="font-bold">{sheet.bpm}</span> BPM
                </span>
              )}
              {sheet.key && (
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Hash className="w-4 h-4 text-[#E6C79C]" />
                  <span className="font-bold">Key of {sheet.key}</span>
                </span>
              )}
              {sheet.moodTags?.length > 0 && sheet.moodTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <TagIcon className="w-4 h-4 text-[#E6C79C]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
            
            <div className="text-3xl font-bold text-[#E6C79C]">
              {sheet.price && sheet.price !== '0' ? `$${sheet.price}` : 'Free Download'}
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-white/10 my-10" />

        {/* Content Section: Sheet Music & Audio Separated */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Sheet Music Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#E6C79C]" /> 
              Sheet Music View
            </h2>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 min-h-[300px] flex items-center justify-center">
              {sheet.pdfUrl ? (
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                    <FileText className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">High-Res PDF Sheet</h3>
                  <p className="text-[#A1A1AA] text-sm mb-6">Fully printable and optimized for digital viewing.</p>
                  <Button onClick={() => window.open(sheet.pdfUrl, '_blank')} className="bg-[#E6C79C] text-black hover:bg-[#C9A675] font-bold rounded-full w-full">
                    Download & View PDF
                  </Button>
                </div>
              ) : (
                <div className="text-center text-[#A1A1AA]">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No Sheet Music Available</p>
                </div>
              )}
            </div>
          </div>

          {/* MR Audio Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-blue-400" /> 
              MR / Audio Playback
            </h2>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-6 min-h-[300px] flex items-center justify-center">
              {sheet.audioUrl ? (
                <div className="text-center w-full">
                  <div className="w-24 h-24 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                    <Music className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">High-Quality MR</h3>
                  <p className="text-[#A1A1AA] text-sm mb-6">Use this backing track for practice or performance.</p>
                  
                  {/* Native HTML5 Audio Player */}
                  <div className="w-full bg-black/50 p-4 rounded-xl border border-white/5 shadow-inner">
                    <audio controls className="w-full outline-none" controlsList="nodownload">
                      <source src={sheet.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                  
                  <div className="mt-4">
                    <Button onClick={() => {
                        const a = document.createElement('a');
                        a.href = sheet.audioUrl!;
                        a.download = `${sheet.title}_MR.mp3`;
                        a.target = '_blank';
                        a.click();
                      }} 
                      variant="outline"
                      className="border-blue-400 text-blue-400 hover:bg-blue-400/10 font-bold rounded-full w-full"
                    >
                      Download MP3 Audio
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#A1A1AA]">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No Audio Track Available</p>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Optional YouTube Video Section */}
        {sheet.youtubeId && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-red-500" /> YouTube Performance / Guide
            </h2>
            <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${sheet.youtubeId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
