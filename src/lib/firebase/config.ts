import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// In a real scenario, this would come from an environment variable or Build injection.
// Example: const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}");
let firebaseConfig = {};

try {
  // The user prompt indicated use of __firebase_config but for build time safety it is wrapped or mocked.
  // @ts-expect-error __firebase_config might be injected by a bundler
  if (typeof __firebase_config !== "undefined") {
    // @ts-expect-error
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
} catch (error) {
  console.warn("Firebase config not found. Please setup environment variables.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
