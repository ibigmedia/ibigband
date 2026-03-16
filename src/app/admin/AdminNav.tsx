"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Music, FileText, Users, Video, DollarSign, Calendar, Mail, Library } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: '회원/멤버 관리', icon: Users },
  { href: '/admin/library', label: '라이브러리(공유)', icon: Library },
  { href: '/admin/schedule', label: '일정 관리', icon: Calendar },
  { href: '/admin/budget', label: '예산 및 플래닝', icon: DollarSign },
  { href: '/admin/mail', label: '보고 및 이메일', icon: Mail },
  { href: '/admin/sheets', label: 'Sheets DB', icon: Music },
  { href: '/admin/music', label: '음반 관리', icon: Music },
  { href: '/admin/video', label: '영상 관리', icon: Video },
  { href: '/admin/blog', label: 'Blog 컨텐츠', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: FileText },
];

export function AdminSideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-black/20 p-6 hidden lg:block border-r border-white/5">
      <h2 className="text-2xl font-handwriting text-[#E6C79C] mb-10 leading-relaxed">
        ibiGband<br />Admin Space
      </h2>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-[#E6C79C]/10 text-[#E6C79C] font-bold'
                  : 'text-white/60 hover:text-[#E6C79C] hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-[#E6C79C]' : ''} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#2D2926]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-around items-center h-20 px-2 lg:px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
                isActive ? 'text-[#E6C79C]' : 'text-white/50 hover:text-white'
              }`}
            >
              <div
                className={`flex items-center justify-center w-14 h-8 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-[#E6C79C]/20' : 'bg-transparent'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-[#E6C79C]' : ''} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
