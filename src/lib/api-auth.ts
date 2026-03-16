import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';

/**
 * API 라우트에서 Firebase ID 토큰을 검증하고 admin 여부를 확인합니다.
 * 성공 시 caller의 uid를 반환하고, 실패 시 NextResponse 에러를 반환합니다.
 */
export async function verifyAdmin(req: Request): Promise<
  { uid: string } | NextResponse
> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: 토큰이 필요합니다.' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin이 초기화되지 않았습니다.' }, { status: 500 });
  }

  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const callerUid = decodedToken.uid;

  const callerDoc = await adminDb.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: 관리자만 사용할 수 있습니다.' }, { status: 403 });
  }

  return { uid: callerUid };
}

/** verifyAdmin 결과가 에러 응답인지 확인 */
export function isErrorResponse(result: { uid: string } | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
