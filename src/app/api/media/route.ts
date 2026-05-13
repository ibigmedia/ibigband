import { adminDb } from '@/lib/firebase/admin';
import { NextResponse } from 'next/server';
import { corsHeaders, handlePreflight } from '@/lib/api/cors';

export const OPTIONS = handlePreflight;

/**
 * 통합 미디어 API — 음원(tracks) + 악보(sheets)를 한 번에 반환
 * GET /api/media
 * GET /api/media?type=tracks    (음원만)
 * GET /api/media?type=sheets    (악보만)
 */
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503, headers });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'tracks' | 'sheets' | null(전체)

  try {
    const result: Record<string, unknown> = {};

    // 음원
    if (!type || type === 'tracks') {
      const musicSnap = await adminDb.collection('music').get();
      const tracks: unknown[] = [];

      musicSnap.docs.forEach((doc) => {
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

      result.tracks = tracks;
    }

    // 악보 (공개만)
    if (!type || type === 'sheets') {
      const sheetsSnap = await adminDb.collection('sheets').get();

      result.sheets = sheetsSnap.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            artistId: data.artistId || '',
            youtubeId: data.youtubeId || '',
            bpm: data.bpm || 0,
            key: data.key || '',
            moodTags: data.moodTags || [],
            pdfUrl: data.pdfUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            audioUrl: data.audioUrl || '',
            level: data.level || '',
            albumId: data.albumId || '',
            trackId: data.trackId || '',
            isPremiumOnly: data.isPremiumOnly,
          };
        })
        .filter((sheet) => sheet.isPremiumOnly !== true)
        .map(({ isPremiumOnly, ...sheet }) => sheet);
    }

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500, headers });
  }
}
