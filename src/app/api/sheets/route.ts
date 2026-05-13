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
    const snapshot = await adminDb.collection('sheets').get();

    const sheets = snapshot.docs.map((doc) => {
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

    return NextResponse.json({ sheets, total: sheets.length }, { headers });
  } catch (error) {
    console.error('Sheets API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sheets' }, { status: 500, headers });
  }
}
