"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, CreditCard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { PaymentModal } from '@/components/payment/PaymentModal';

export default function Navigation() {
  const pathname = usePathname();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, userData, signInWithGoogle, signOut } = useAuth();

  const navItems = [
    { label: '음악', enLabel: 'Music', path: '/music' },
    { label: '영상', enLabel: 'Video', path: '/video' },
    { label: '악보', enLabel: 'Sheets', path: '/sheets' },
    { label: '저장소', enLabel: 'Archive', path: '/archive' },
    { label: 'Seekers', enLabel: '구도자', path: '/seekers' },
    { label: '블로그', enLabel: 'Blog', path: '/blog' },
    { label: '셑리스트', enLabel: 'Set List', path: '/setlist' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-md px-5 md:px-8 py-3 md:py-5 flex justify-between items-center border-b border-[#78716A]/10">
        <Link href="/" className="flex items-center gap-2 md:gap-3 cursor-pointer">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#2D2926] rounded-xl flex items-center justify-center overflow-hidden shrink-0">
            <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-7 md:h-7 fill-white">
              <rect x="10" y="20" width="15" height="60" rx="4" />
              <path d="M35 20 Q50 20 50 40 Q50 60 35 60 L35 20" />
              <rect x="60" y="20" width="15" height="60" rx="4" />
              <path d="M85 80 Q95 80 95 65 L95 35 Q95 20 85 20" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-3xl md:text-4xl font-handwriting font-bold tracking-tight mt-1">ibiGband</span>
        </Link>
        <div className="hidden lg:flex flex-1 justify-end items-center gap-1 xl:gap-2 text-[15px] xl:text-base font-semibold">
          {navItems.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link 
                key={item.label} 
                href={item.path}
                className={`group min-w-[70px] xl:min-w-[80px] text-center transition-colors px-3 py-1.5 rounded-full ${isActive ? 'bg-[#2D2926] text-[#E6C79C]' : 'text-[#78716A] hover:bg-[#2D2926]/15 hover:text-[#2D2926]'}`}
              >
                <span className="block group-hover:hidden">{item.label}</span>
                <span className="hidden group-hover:block font-sans text-[14px] xl:text-[15px]">{item.enLabel}</span>
              </Link>
            )
          })}
          <div className="h-4 w-[1px] bg-[#78716A]/20 mx-1" />
          
          {user ? (
            <>
              {userData?.role === 'admin' && (
                <Link href="/admin" className="p-2 hover:bg-[#78716A]/5 rounded-full text-[#2D2926]">
                  <Settings size={20} />
                </Link>
              )}
              {userData?.isPremium ? (
                <div className="flex items-center gap-2 bg-[#2D2926] text-[#E6C79C] px-5 py-2 rounded-full text-sm font-bold">
                  <CreditCard size={16} /> 프리미엄 멤버
                </div>
              ) : (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)} 
                  className="flex items-center gap-2 bg-[#E6C79C] text-[#2D2926] px-5 py-2 rounded-full text-sm font-bold hover:shadow-lg transition-all"
                >
                  <CreditCard size={16} /> 프리미엄 구독
                </button>
              )}
              <button onClick={signOut} className="p-2 hover:bg-[#78716A]/5 rounded-full text-[#78716A]" title="로그아웃">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 bg-[#2D2926] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#78716A] transition-all">
              <LogIn size={16} /> 로그인 / 회원가입
            </Link>
          )}

        </div>
        
        {/* Mobile Menu Toggle Button */}
        <button 
          className="lg:hidden p-2 -mr-2 text-[#2D2926]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] md:top-[88px] z-40 bg-[#FAF9F6] lg:hidden overflow-y-auto pb-20 border-t border-[#78716A]/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-6 gap-0">
            {navItems.map(item => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link 
                  key={item.label} 
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`font-handwriting font-medium text-[22px] px-4 py-2 flex items-baseline gap-2 rounded-xl transition-colors ${isActive ? 'bg-[#2D2926] text-[#E6C79C]' : 'text-[#2D2926] hover:bg-[#2D2926]/10'}`}
                >
                  <span>{item.label}</span>
                  <span className="text-[14px] font-sans tracking-wide opacity-60">({item.enLabel})</span>
                </Link>
              )
            })}
            
            <div className="mt-8 flex flex-col gap-4">
              {user ? (
                <>
                  {userData?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 py-3 text-lg font-bold text-[#2D2926]">
                      <Settings size={22} /> 대시보드 가기
                    </Link>
                  )}
                  {userData?.isPremium ? (
                    <div className="flex items-center justify-center gap-2 bg-[#2D2926] text-[#E6C79C] px-6 py-4 rounded-2xl text-base font-bold w-full">
                      <CreditCard size={18} /> 프리미엄 멤버
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsPaymentModalOpen(true); setIsMobileMenuOpen(false); }} 
                      className="flex items-center justify-center gap-2 bg-[#E6C79C] text-[#2D2926] px-6 py-4 rounded-2xl text-base font-bold w-full shadow-md"
                    >
                      <CreditCard size={18} /> 프리미엄 구독
                    </button>
                  )}
                  <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 py-3 text-lg font-bold text-[#78716A] mt-2 border-t border-[#78716A]/10 pt-6">
                    <LogOut size={22} /> 로그아웃
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-[#2D2926] text-white px-6 py-4 rounded-2xl text-lg font-bold w-full mt-2 hover:bg-[#78716A] shadow-lg">
                  <LogIn size={20} /> 로그인 / 회원가입
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
