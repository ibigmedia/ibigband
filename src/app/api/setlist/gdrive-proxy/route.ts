import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import '@/lib/firebase/admin'; // ensures admin is initialized

export async function POST(request: Request) {
  try {
    const { fileId, accessToken, fileName, userId } = await request.json();

    if (!fileId || !accessToken) {
      return NextResponse.json({ error: 'fileId and accessToken required' }, { status: 400 });
    }

    // Download file from Google Drive server-side (no CORS)
    const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!dlRes.ok) {
      const errText = await dlRes.text().catch(() => 'Unknown error');
      return NextResponse.json({ error: `Google Drive error: ${dlRes.status}` }, { status: 502 });
    }

    const buffer = Buffer.from(await dlRes.arrayBuffer());
    const contentType = dlRes.headers.get('content-type') || 'application/octet-stream';

    // Upload to Firebase Storage via Admin SDK
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!admin.apps.length || !bucketName) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const bucket = admin.storage().bucket(bucketName);
    const safeName = (fileName || 'file').replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
    const storagePath = `gdrive_imports/${userId || 'anon'}/${Date.now()}_${safeName}`;
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server Error';
    console.error('GDrive proxy error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
