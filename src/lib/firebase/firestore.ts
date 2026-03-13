import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, QueryConstraint } from 'firebase/firestore';
import { db } from './config';

// === Models ===

export interface Artist {
  id?: string;
  name: string;
  bio: string;
  imageUrl: string;
}

export interface SheetMusic {
  id?: string;
  title: string;
  artistId: string;
  bpm: number;
  key: string;
  moodTags: string[];
  pdfUrl: string;
  audioUrl?: string;
  isPremiumOnly: boolean;
  createdAt: number;
}

export interface SetList {
  id?: string;
  userId: string;
  title: string;
  date: number;
  items: Array<{
    type: 'music' | 'guide';
    title: string;
    sheetId?: string;
    duration?: string;
    note?: string;
  }>;
}

export interface BlogPost {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl?: string;
  createdAt: number;
  tags: string[];
}

// === Helpers ===

export const getCollectionDocs = async <T,>(colName: string, constraints: QueryConstraint[] = []): Promise<T[]> => {
  const q = query(collection(db, colName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const getDocById = async <T,>(colName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, colName, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as T;
  }
  return null;
};

export const createOrUpdateDoc = async (colName: string, id: string, data: any) => {
  const docRef = doc(db, colName, id);
  await setDoc(docRef, data, { merge: true });
};

export const addDocument = async (colName: string, data: any): Promise<string> => {
  const { addDoc, collection } = await import('firebase/firestore');
  const docRef = await addDoc(collection(db, colName), data);
  return docRef.id;
};

export const deleteDocument = async (colName: string, id: string) => {
  const { deleteDoc, doc } = await import('firebase/firestore');
  const docRef = doc(db, colName, id);
  await deleteDoc(docRef);
};
