import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './config';
import { Favorite } from '@/types/favorite';

/** 즐겨찾기 추가 */
export async function addFavorite(uid: string, data: Omit<Favorite, 'createdAt'>) {
  const ref = doc(db, 'users', uid, 'favorites', data.sheetId);
  await setDoc(ref, {
    ...data,
    createdAt: Date.now(),
  });
}

/** 즐겨찾기 제거 */
export async function removeFavorite(uid: string, sheetId: string) {
  const ref = doc(db, 'users', uid, 'favorites', sheetId);
  await deleteDoc(ref);
}

/** 즐겨찾기 여부 확인 */
export async function isFavorite(uid: string, sheetId: string): Promise<boolean> {
  const ref = doc(db, 'users', uid, 'favorites', sheetId);
  const snap = await getDoc(ref);
  return snap.exists();
}

/** 즐겨찾기 목록 조회 (최신순) */
export async function getFavorites(uid: string): Promise<Favorite[]> {
  const q = query(
    collection(db, 'users', uid, 'favorites'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ sheetId: doc.id, ...doc.data() } as Favorite));
}

/** 즐겨찾기한 악보 ID 목록 조회 */
export async function getFavoriteSheetIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snapshot.docs.map((doc) => doc.id);
}
