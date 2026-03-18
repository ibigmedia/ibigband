"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPremium: boolean;
  role: 'user' | 'admin';
  grade?: 'basic' | 'member' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
  bio?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string, bio: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({}),
  signUpWithEmail: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect Auth Error:", error);
      if (error?.code === 'auth/unauthorized-domain') {
        alert("승인되지 않은 도메인입니다. 파이어베이스 콘솔에서 도메인을 추가해주세요.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          // 구글 로그인으로 처음 접속한 경우 자동 생성 (approved)
          const newUserData: UserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            isPremium: false,
            role: 'user',
            status: 'approved',
            createdAt: serverTimestamp(),
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
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error?.code === 'auth/popup-blocked') {
        alert('팝업이 차단되었습니다. 팝업 차단을 해제한 뒤 다시 시도해주세요.');
      } else if (error?.code === 'auth/unauthorized-domain') {
        alert('승인되지 않은 도메인입니다. 파이어베이스 콘솔에서 도메인을 추가해주세요.');
      } else {
        alert('구글 로그인 중 오류: ' + (error?.message || '알 수 없는 오류'));
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, bio: string): Promise<{ error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 프로필 업데이트
      await updateProfile(cred.user, { displayName: name });

      // Firestore 사용자 문서 생성 (status: pending)
      const newUserData: UserData = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        photoURL: null,
        isPremium: false,
        role: 'user',
        status: 'pending',
        bio,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUserData);

      // 커스텀 인증 이메일 발송
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: cred.user.uid }),
        });
      } catch (emailErr) {
        console.error('커스텀 인증 이메일 발송 실패, Firebase 기본 이메일로 대체:', emailErr);
        await sendEmailVerification(cred.user);
      }

      // 가입 직후 로그아웃 (승인 대기 상태)
      await firebaseSignOut(auth);

      return {};
    } catch (error: any) {
      console.error("Email signup error:", error);
      if (error?.code === 'auth/email-already-in-use') {
        return { error: '이미 등록된 이메일입니다.' };
      } else if (error?.code === 'auth/weak-password') {
        return { error: '비밀번호는 6자 이상이어야 합니다.' };
      } else if (error?.code === 'auth/invalid-email') {
        return { error: '유효하지 않은 이메일 형식입니다.' };
      }
      return { error: error?.message || '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 이메일 인증 확인
      if (!cred.user.emailVerified) {
        await firebaseSignOut(auth);
        return { error: '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.' };
      }

      // 관리자 승인 확인
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.status === 'pending') {
          await firebaseSignOut(auth);
          return { error: '관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.' };
        } else if (data.status === 'rejected') {
          await firebaseSignOut(auth);
          return { error: '가입이 거절되었습니다. 관리자에게 문의해주세요.' };
        }
      }

      return {};
    } catch (error: any) {
      console.error("Email signin error:", error);
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      } else if (error?.code === 'auth/too-many-requests') {
        return { error: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.' };
      }
      return { error: error?.message || '로그인 중 오류가 발생했습니다.' };
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
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
