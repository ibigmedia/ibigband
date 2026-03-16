import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAdmin, isErrorResponse } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdmin(req);
    if (isErrorResponse(authResult)) return authResult;

    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await adminDb!.collection('users').doc(uid).set({
      role: 'admin',
      updatedAt: Date.now(),
    }, { merge: true });

    return NextResponse.json({ success: true, message: 'Successfully promoted to admin.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server Error';
    console.error("Make Admin Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
