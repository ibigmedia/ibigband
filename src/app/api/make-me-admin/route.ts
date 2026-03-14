import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin DB is not initialized.");
    }

    // users 콜렉션의 해당 uid 문서의 role을 'admin'으로 변경합니다.
    await adminDb.collection('users').doc(uid).set({
      role: 'admin',
      updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'Successfully promoted to admin.' });
  } catch (error: any) {
    console.error("Make Admin Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
