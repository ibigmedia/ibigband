"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPremium: boolean;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 리다이렉트 로그인 결과 (혹은 에러) 처리
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect Auth Error:", error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert("승인되지 않은 도메인입니다. 파이어베이스 콘솔(Authentication -> Settings -> Authorized domains)에 현재 도메인을 추가해주세요.");
      } else {
        alert("구글 로그인 중 오류가 발생했습니다: " + error.message);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user document in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          const newUserData: UserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isPremium: false,
            role: 'user'
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // 모바일(Safari, Chrome)에서 도메인 간 교차 쿠키 추적 방지(ITP)로 인해 
      // Redirect가 무한 루프 무시되는 이슈를 해결하기 위해 
      // 모든 플랫폼에서 팝업(Popup)을 강제로 사용합니다.
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error?.code === 'auth/popup-blocked') {
        alert('구글 로그인 팝업이 차단되었습니다. 모바일 브라우저나 인앱 브라우저(카카오톡 등)의 설정에서 팝업 차단을 해제한 뒤 다시 시도해주세요.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        alert('파이어베이스 승인되지 않은 도메인 에러입니다. 콘솔에서 도메인을 추가해주세요.');
      } else {
        alert('구글 로그인 중 오류가 발생했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
