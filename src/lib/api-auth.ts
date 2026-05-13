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

/** verifyAdmin / verifyUser 결과가 에러 응답인지 확인 */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

export interface VerifiedUser {
  uid: string;
  role?: 'user' | 'admin';
  grade?: 'basic' | 'member' | 'admin';
  isPremium?: boolean;
}

/**
 * 일반 회원용 토큰 검증. 토큰이 없거나 잘못된 경우 null 반환(게스트 처리),
 * Admin SDK 초기화 실패 등 서버 에러일 때만 NextResponse를 반환합니다.
 */
export async function verifyUser(req: Request): Promise<VerifiedUser | null | NextResponse> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null; // 게스트
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin이 초기화되지 않았습니다.' }, { status: 500 });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const data = userDoc.exists ? userDoc.data() : undefined;
    return {
      uid: decoded.uid,
      role: data?.role,
      grade: data?.grade,
      isPremium: data?.isPremium,
    };
  } catch (e) {
    // 만료/위조 토큰 → 게스트로 처리
    return null;
  }
}

/** 프리미엄 sheet 접근 가능 여부 (Navigation/Modal 규칙과 일치) */
export function canAccessPremium(user: VerifiedUser | null): boolean {
  if (!user) return false;
  return Boolean(
    user.isPremium ||
      user.grade === 'member' ||
      user.grade === 'admin' ||
      user.role === 'admin'
  );
}
