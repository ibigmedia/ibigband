"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, CreditCard, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { PaymentModal } from '@/components/payment/PaymentModal';

export default function Navigation() {
  const pathname = usePathname();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { user, userData, signInWithGoogle, signOut } = useAuth();

  const navItems = [
    { label: 'Music', path: '/music' },
    { label: 'Video', path: '/video' },
    { label: 'Archive', path: '/archive' },
    { label: 'Seekers', path: '/seekers' },
    { label: 'Blog', path: '/blog' },
    { label: 'SetList', path: '/setlist' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-[#78716A]/10">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-[#2D2926] rounded-xl flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-6 h-6 fill-white">
              <rect x="10" y="20" width="15" height="60" rx="4" />
              <path d="M35 20 Q50 20 50 40 Q50 60 35 60 L35 20" />
              <rect x="60" y="20" width="15" height="60" rx="4" />
              <path d="M85 80 Q95 80 95 65 L95 35 Q95 20 85 20" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-2xl font-handwriting font-bold tracking-tight">ibigband</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link 
                key={item.label} 
                href={item.path}
                className={`hover:text-[#E6C79C] transition-colors ${isActive ? 'text-[#E6C79C]' : 'text-[#2D2926]'}`}
              >
                {item.label}
              </Link>
            )
          })}
          <div className="h-4 w-[1px] bg-[#78716A]/20" />
          
          {user ? (
            <>
              {userData?.role === 'admin' && (
                <Link href="/admin" className="p-2 hover:bg-[#78716A]/5 rounded-full text-[#2D2926]">
                  <Settings size={20} />
                </Link>
              )}
              {userData?.isPremium ? (
                <div className="flex items-center gap-2 bg-[#2D2926] text-[#E6C79C] px-5 py-2 rounded-full text-xs font-bold">
                  <CreditCard size={14} /> Premium User
                </div>
              ) : (
                <button 
                  onClick={() => setIsPaymentModalOpen(true)} 
                  className="flex items-center gap-2 bg-[#E6C79C] text-[#2D2926] px-5 py-2 rounded-full text-xs font-bold hover:shadow-lg transition-all"
                >
                  <CreditCard size={14} /> Go Premium
                </button>
              )}
              <button onClick={signOut} className="p-2 hover:bg-[#78716A]/5 rounded-full text-[#78716A]" title="로그아웃">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button onClick={signInWithGoogle} className="flex items-center gap-2 bg-[#2D2926] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-[#78716A] transition-all">
              <LogIn size={14} /> Google Login
            </button>
          )}

        </div>
      </nav>
      
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
      />
    </>
  );
}
