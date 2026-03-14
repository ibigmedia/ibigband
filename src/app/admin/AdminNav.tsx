"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Music, FileText, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/sheets', label: 'Sheets', icon: Music },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminSideNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-black/20 p-6 hidden md:block border-r border-white/5">
      <h2 className="text-2xl font-handwriting text-[#E6C79C] mb-10 leading-relaxed">
        ibigband<br />Admin Space
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#2D2926]/95 backdrop-blur-xl border-t border-white/10 z-50 pb-[env(safe-area-inset-bottom)]">
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
