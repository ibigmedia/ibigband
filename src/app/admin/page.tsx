"use client";

import React, { useState } from 'react';
import { Users, FileText, Music, DollarSign, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const [loadingPromote, setLoadingPromote] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!user) return alert("로그인 먼저 해주세요.");
    setLoadingPromote(true);
    try {
      const res = await fetch('/api/make-me-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("관리자로 승급되었습니다! 홈페이지를 새로고침(F5) 해주세요.");
      window.location.reload();
    } catch (e: any) {
      alert("승급 실패: " + e.message);
    } finally {
      setLoadingPromote(false);
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-[#E6C79C] mb-2" />
        <h2 className="text-2xl font-bold text-[#E6C79C]">접근 권한이 없습니다</h2>
        <p className="text-white/50 text-sm">이 페이지는 관리자만 열람할 수 있습니다.</p>
        
        {/* 개발 환경 전용 임시 승급 버튼 */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mt-8 p-6 bg-black/20 rounded-ibig border border-dashed border-[#E6C79C]/50">
            <p className="text-xs text-white/50 mb-4">개발용 기능: 현재 접속하신 계정({user.email})에 임시로 관리자 권한을 부여할 수 있습니다.</p>
            <Button onClick={handlePromoteToAdmin} disabled={loadingPromote} className="bg-[#E6C79C] text-[#2D2926]">
              {loadingPromote ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
              클릭하여 내 계정을 관리자로 승급하기
            </Button>
          </div>
        )}
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: '1,280', icon: <Users size={20}/> },
    { label: 'Premium Subscribers', value: '124', icon: <DollarSign size={20}/> },
    { label: 'Sheets Available', value: '450', icon: <FileText size={20}/> },
    { label: 'Audio Tracks', value: '380', icon: <Music size={20}/> },
  ];

  return (
    <div>
      <h1 className="text-3xl font-handwriting mb-8 text-[#E6C79C]">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-[#E6C79C]/20 text-[#E6C79C]">
              {stat.icon}
            </div>
            <div>
              <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 p-8 rounded-ibig border border-white/10">
          <h3 className="text-xl font-handwriting mb-6">최근 업로드된 악보</h3>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold">주가 일하시네 (Key of G)</p>
                  <p className="text-[10px] text-white/50">2024.11.20 | Premium</p>
                </div>
                <button className="text-xs text-[#E6C79C] hover:underline">Edit</button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/5 p-8 rounded-ibig border border-white/10">
          <h3 className="text-xl font-handwriting mb-6">CMS 빠른 실행</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-[#E6C79C]/10 rounded-2xl text-center hover:bg-[#E6C79C]/20 transition-colors">
              <FileText className="mx-auto mb-2 text-[#E6C79C]" size={24}/>
              <span className="text-xs font-bold">새 악보 등록</span>
            </button>
            <button className="p-6 bg-[#E6C79C]/10 rounded-2xl text-center hover:bg-[#E6C79C]/20 transition-colors">
              <Music className="mx-auto mb-2 text-[#E6C79C]" size={24}/>
              <span className="text-xs font-bold">새 블로그 발행</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
