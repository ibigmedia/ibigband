import * as admin from 'firebase-admin';

if (!admin.apps.length && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase Admin 초기화 실패:', error.stack);
  }
}

// 빌드 시 등 환경변수가 누락된 상태에서 DB에 접근하려다 크래시가 나는 것을 막기 위함입니다.
export const adminDb = admin.apps.length ? admin.firestore() : null;

