import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { corsHeaders, handlePreflight } from '@/lib/api/cors';

export const OPTIONS = handlePreflight;

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503, headers });
  }

  try {
    const snapshot = await adminDb.collection('music').get();

    const tracks: Array<{
      id: string;
      albumId: string;
      albumTitle: string;
      albumCoverUrl: string;
      title: string;
      duration: string;
      credits: Record<string, string>;
      versions: Array<{
        lang: string;
        title: string;
        audioUrl: string;
        lyrics: string;
        vocal?: string;
      }>;
    }> = [];

    snapshot.docs.forEach((doc) => {
      const album = doc.data();
      if (!album.tracks) return;

      for (const track of album.tracks) {
        tracks.push({
          id: track.id,
          albumId: doc.id,
          albumTitle: album.title,
          albumCoverUrl: album.coverUrl || '',
          title: track.title,
          duration: track.duration || '',
          credits: track.credits || {},
          versions: (track.versions || []).map(
            (v: { lang: string; title: string; audioUrl: string; lyrics: string; vocal?: string }) => ({
              lang: v.lang,
              title: v.title,
              audioUrl: v.audioUrl,
              lyrics: v.lyrics,
              vocal: v.vocal,
            })
          ),
        });
      }
    });

    return NextResponse.json({ tracks, total: tracks.length }, { headers });
  } catch (error) {
    console.error('Tracks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500, headers });
  }
}
