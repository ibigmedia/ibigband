"use client";

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Settings, CreditCard, LogIn, LogOut, Menu, X, User } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { PaymentModal } from '@/components/payment/PaymentModal';
import LanguageSwitcher from './LanguageSwitcher';
import BandMark from '@/components/layout/BandMark';

export default function Navigation() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userData, signInWithGoogle, signOut } = useAuth();

  const navItems = [
    { key: 'music', path: '/music' },
    { key: 'video', path: '/video' },
    { key: 'sheets', path: '/sheets' },
    { key: 'archive', path: '/archive' },
    { key: 'seekers', path: '/seekers' },
    { key: 'blog', path: '/blog' },
    { key: 'setlist', path: '/setlist' },
  ] as const;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#F5F2EC]/80 backdrop-blur-md px-5 md:px-8 py-3 md:py-5 flex justify-between items-center border-b border-[#78716A]/10">
        <Link href="/" className="flex items-center gap-2 md:gap-3 cursor-pointer">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#121110] rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            <BandMark className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <span className="text-3xl md:text-4xl font-wordmark tracking-tight mt-1">ibiGband</span>
        </Link>
        <div className="hidden lg:flex flex-1 justify-end items-center gap-1 xl:gap-2 text-[15px] xl:text-base font-semibold">
          {navItems.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.key}
                href={item.path}
                className={`min-w-[70px] xl:min-w-[80px] text-center transition-colors px-3 py-1.5 rounded-full ${isActive ? 'bg-[#121110] text-t-gold' : 'text-t-muted hover:bg-[#121110]/15 hover:text-[#121110]'}`}
              >
                {t(item.key)}
              </Link>
            )
          })}
          <div className="h-4 w-[1px] bg-[#2A2826]/20 mx-1" />

          <LanguageSwitcher compact />

          {user ? (
            <>
              {userData?.role === 'admin' && (
                <Link href="/admin" className="p-2 hover:bg-[#2A2826]/5 rounded-full text-[#121110]">
                  <Settings size={20} />
                </Link>
              )}
              <Link href="/mypage" className="p-2 hover:bg-[#2A2826]/5 rounded-full text-t-muted" title={t('myPage')}>
                <User size={20} />
              </Link>
              {(userData?.grade === 'member' || userData?.grade === 'admin' || userData?.role === 'admin') ? null : userData?.isPremium ? (
                <div className="flex items-center gap-2 bg-[#121110] text-t-gold px-5 py-2 rounded-full text-sm font-bold">
                  <CreditCard size={16} /> {t('premiumMember')}
                </div>
              ) : (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-2 bg-[#E8481C] text-[#121110] px-5 py-2 rounded-full text-sm font-bold hover:shadow-lg transition-all"
                >
                  <CreditCard size={16} /> {t('premiumSubscribe')}
                </button>
              )}
              <button onClick={signOut} className="p-2 hover:bg-[#2A2826]/5 rounded-full text-t-muted" title={t('signOut')}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 bg-[#121110] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#2A2826] transition-all">
              <LogIn size={16} /> {t('loginSignup')}
            </Link>
          )}

        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="lg:hidden p-2 -mr-2 text-[#121110]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] md:top-[88px] z-40 bg-[#F5F2EC] lg:hidden overflow-y-auto pb-20 border-t border-[#78716A]/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-6 gap-0">
            {navItems.map(item => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-medium text-[15px] px-4 py-2 rounded-xl transition-colors ${isActive ? 'bg-[#121110] text-t-gold' : 'text-[#121110] hover:bg-[#121110]/10'}`}
                >
                  {t(item.key)}
                </Link>
              )
            })}

            <div className="mt-8 flex flex-col gap-4">
              <LanguageSwitcher />

              {user ? (
                <>
                  {userData?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-bold text-[#121110]">
                      <Settings size={22} /> {t('dashboard')}
                    </Link>
                  )}
                  <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-bold text-[#121110]">
                    <User size={22} /> {t('myPage')}
                  </Link>
                  {(userData?.grade === 'member' || userData?.grade === 'admin' || userData?.role === 'admin') ? null : userData?.isPremium ? (
                    <div className="flex items-center justify-center gap-2 bg-[#121110] text-t-gold px-6 py-4 rounded-2xl text-base font-bold w-full">
                      <CreditCard size={18} /> {t('premiumMember')}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsPaymentModalOpen(true); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 bg-[#E8481C] text-[#121110] px-6 py-4 rounded-2xl text-base font-bold w-full shadow-md"
                    >
                      <CreditCard size={18} /> {t('premiumSubscribe')}
                    </button>
                  )}
                  <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 text-lg font-bold text-t-muted mt-2 border-t border-[#78716A]/10 pt-6">
                    <LogOut size={22} /> {t('signOut')}
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-[#121110] text-white px-6 py-4 rounded-2xl text-lg font-bold w-full mt-2 hover:bg-[#2A2826] shadow-lg">
                  <LogIn size={20} /> {t('loginSignup')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </>
  );
}
