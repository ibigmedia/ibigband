"use client";

import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Mail, Lock, User, FileText, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // 폼 필드
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  // 이미 로그인된 경우 홈으로
  if (user) {
    router.push('/');
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError(t('errNameRequired')); return; }
    if (!email.trim()) { setError(t('errEmailRequired')); return; }
    if (password.length < 6) { setError(t('errPasswordLength')); return; }
    if (!bio.trim()) { setError(t('errBioRequired')); return; }

    setLoading(true);
    const result = await signUpWithEmail(email, password, name.trim(), bio.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setSignupSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  // 가입 완료 화면
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D2926] mb-3">{t('successTitle')}</h1>
          <p className="text-[#78716A] mb-2">
            {t.rich('successEmailSent', { b: (chunks) => <strong className="text-[#2D2926]">{chunks}</strong>, email })}
          </p>
          <p className="text-[#78716A] text-sm mb-8">
            {t('successApproval')}
          </p>
          <div className="bg-[#E6C79C]/10 border border-[#E6C79C]/30 rounded-xl p-4 text-sm text-[#78716A] mb-8">
            <p className="font-bold text-[#2D2926] mb-1">{t('stepsTitle')}</p>
            <ol className="text-left space-y-1.5 list-decimal list-inside">
              <li>{t('step1')} <span className="text-[#E6C79C] font-bold">{t('stepNow')}</span></li>
              <li>{t('step2')}</li>
              <li>{t('step3')}</li>
            </ol>
          </div>
          <button onClick={() => { setSignupSuccess(false); setMode('login'); }}
            className="text-[#2D2926] font-bold hover:underline">
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#2D2926] rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
                <rect x="10" y="20" width="15" height="60" rx="4" />
                <path d="M35 20 Q50 20 50 40 Q50 60 35 60 L35 20" />
                <rect x="60" y="20" width="15" height="60" rx="4" />
                <path d="M85 80 Q95 80 95 65 L95 35 Q95 20 85 20" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-3xl font-handwriting font-bold tracking-tight">ibiGband</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#2D2926]">
            {mode === 'login' ? t('titleLogin') : t('titleSignup')}
          </h1>
          <p className="text-[#78716A] text-sm mt-1">
            {mode === 'login' ? t('subtitleLogin') : t('subtitleSignup')}
          </p>
        </div>

        {/* 구글 로그인 */}
        <button onClick={handleGoogleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#78716A]/20 rounded-xl px-4 py-3.5 text-sm font-bold text-[#2D2926] hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {mode === 'login' ? t('googleLogin') : t('googleSignup')}
        </button>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#78716A]/20" />
          <span className="text-xs text-[#78716A] font-medium">{t('orEmail')}</span>
          <div className="flex-1 h-px bg-[#78716A]/20" />
        </div>

        {/* 이메일 폼 */}
        <form onSubmit={mode === 'login' ? handleEmailLogin : handleEmailSignup} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-bold text-[#2D2926] block mb-1.5">{t('labelName')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716A]" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder={t('placeholderName')}
                  className="w-full bg-white border border-[#78716A]/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-[#2D2926] block mb-1.5">{t('labelEmail')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716A]" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-[#78716A]/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#2D2926] block mb-1.5">{t('labelPassword')}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716A]" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? t('placeholderPasswordSignup') : t('placeholderPasswordLogin')}
                className="w-full bg-white border border-[#78716A]/20 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716A] hover:text-[#2D2926]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-sm font-bold text-[#2D2926] block mb-1.5">{t('labelBio')}</label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3.5 text-[#78716A]" />
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  placeholder={t('placeholderBio')}
                  rows={3}
                  className="w-full bg-white border border-[#78716A]/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#2D2926] transition-colors resize-none" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <p className="font-bold mb-1">{t('noticeTitle')}</p>
              <p className="text-xs leading-relaxed">
                {t.rich('noticeBody', { b: (chunks) => <strong>{chunks}</strong> })}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#2D2926] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#78716A] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? t('titleLogin') : t('titleSignup')}
          </button>
        </form>

        {/* 모드 전환 */}
        <div className="text-center mt-6 text-sm text-[#78716A]">
          {mode === 'login' ? (
            <>
              {t('switchToSignupQ')}{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="font-bold text-[#2D2926] hover:underline">
                {t('titleSignup')}
              </button>
            </>
          ) : (
            <>
              {t('switchToLoginQ')}{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="font-bold text-[#2D2926] hover:underline">
                {t('titleLogin')}
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-xs text-[#78716A] hover:text-[#2D2926] flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> {t('backToMain')}
          </Link>
        </div>
      </div>
    </div>
  );
}
