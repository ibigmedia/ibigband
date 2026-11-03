"use client";

import React, { useState } from 'react';
import { Users, FileText, Music, DollarSign, Loader2, ShieldAlert, ChevronRight, PlusCircle, PenTool } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
  const { user, userData } = useAuth();
  const [loadingPromote, setLoadingPromote] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!user) return alert("로그인 먼저 해주세요.");
    setLoadingPromote(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/make-me-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("관리자로 승급되었습니다! 홈페이지를 새로고침(F5) 해주세요.");
      window.location.reload();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert("승급 실패: " + message);
    } finally {
      setLoadingPromote(false);
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 px-6 p-4">
        <ShieldAlert className="w-16 h-16 text-t-copper mb-2" />
        <h2 className="text-2xl font-bold text-t-copper break-words">접근 권한이 없습니다</h2>
        <p className="text-t-muted text-sm">이 페이지는 관리자만 열람할 수 있습니다.</p>
        
        {/* 개발 환경 전용 임시 승급 버튼 */}
        {process.env.NODE_ENV === 'development' && user && (
          <div className="mt-8 p-6 bg-[#ECE7DC] rounded-ibig border border-dashed border-[#E8481C]/50 w-full max-w-md">
            <p className="text-xs text-t-muted mb-4">개발용 기능: 현재 접속하신 계정({user.email})에 임시로 관리자 권한을 부여할 수 있습니다.</p>
            <Button onClick={handlePromoteToAdmin} disabled={loadingPromote} className="bg-[#E8481C] text-[#121110] w-full">
              {loadingPromote ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
              클릭하여 내 계정을 관리자로 승급하기
            </Button>
          </div>
        )}
      </div>
    );
  }

  const stats = [
    { label: '전체 유저', value: '1,280', icon: <Users size={24} strokeWidth={1.5} />, color: 'bg-blue-500/10 text-t-copper' },
    { label: '프리미엄 구독', value: '124', icon: <DollarSign size={24} strokeWidth={1.5} />, color: 'bg-green-500/10 text-green-800' },
    { label: '악보 수량', value: '450', icon: <FileText size={24} strokeWidth={1.5} />, color: 'bg-orange-500/10 text-orange-400' },
    { label: '오디오 트랙', value: '380', icon: <Music size={24} strokeWidth={1.5} />, color: 'bg-purple-500/10 text-t-copper' },
  ];

  const recentItems = [
    { title: '주가 일하시네 (Key of G)', date: '2024.11.20', type: 'Premium' },
    { title: '은혜 (Key of C)', date: '2024.11.19', type: 'Free' },
    { title: '내 모습 이대로 (Key of D)', date: '2024.11.18', type: 'Premium' },
  ];

  return (
    <div className="w-full">
      {/* =========================================================
          모바일 전용 레이아웃 (Material 3 Style)
          ========================================================= */}
      <div className="lg:hidden flex flex-col space-y-6">
        
        {/* 모바일 헤더 */}
        <div className="pt-2 pb-4 px-2">
          <p className="text-t-muted text-sm mb-1 font-medium">관리자 대시보드</p>
          <h1 className="text-2xl font-bold tracking-tight">환영합니다!</h1>
        </div>

        {/* 모바일 퀵 액션 (가로 스크롤 가능) */}
        <div className="flex gap-4 overflow-x-auto snap-x pb-2 px-2 hide-scrollbar">
          <button className="snap-start shrink-0 flex items-center gap-3 bg-[#E8481C] text-[#121110] px-5 py-4 rounded-3xl font-bold shadow-lg shadow-[#E8481C]/20 border border-[#E8481C]/50 active:scale-95 transition-transform duration-200">
            <PlusCircle size={20} /> 새 악보 등록
          </button>
          <button className="snap-start shrink-0 flex items-center gap-3 bg-[#FFFDF9] text-[#121110] px-5 py-4 rounded-3xl font-medium border border-[#E0DBD0] active:scale-95 transition-transform duration-200">
            <PenTool size={20} /> 새 블로그 발행
          </button>
        </div>

        {/* 모바일 통계 (2x2 Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-2">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#FFFDF9] p-5 rounded-3xl border border-[#E0DBD0] flex flex-col justify-between aspect-square relative overflow-hidden active:bg-[#ECE7DC] transition-colors">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color} mb-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold mb-0.5">{stat.value}</p>
                <p className="text-t-muted text-xs font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 모바일 리스트 디자인 */}
        <div className="px-2 mt-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-bold">최근 업로드</h3>
            <span className="text-xs text-t-copper font-semibold">더보기</span>
          </div>
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#E0DBD0] overflow-hidden flex flex-col">
            {recentItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-5 border-b border-[#E0DBD0] last:border-b-0 active:bg-[#ECE7DC] transition-colors">
                <div className="flex flex-col gap-1 pr-4">
                  <p className="font-bold text-[15px] leading-tight text-[#121110] line-clamp-1">{item.title}</p>
                  <p className="text-xs text-t-muted">{item.date} • <span className={item.type === 'Premium' ? 'text-t-copper' : 'text-t-copper'}>{item.type}</span></p>
                </div>
                <ChevronRight size={18} className="text-t-muted shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* 모바일 하단 여백 추가용 빈 공간은 layout.tsx에서 pb-28 처리됨 */}
      </div>

      {/* =========================================================
          데스크탑 전용 레이아웃 (기존보다 더 세련되게 다듬음)
          ========================================================= */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-handwriting mb-8 text-t-copper">Dashboard Overview</h1>
        
        <div className="grid grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#FFFDF9] p-6 rounded-3xl border border-[#E0DBD0] flex items-center gap-5 hover:bg-[#ECE7DC] transition-colors cursor-default">
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-t-muted text-xs mb-1 font-semibold">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-[#FFFDF9] p-8 rounded-[18px] border border-[#E0DBD0]">
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-2xl font-bold">최근 업로드된 악보</h3>
              <button className="text-sm text-t-copper hover:underline font-medium">전체보기</button>
            </div>
            <div className="space-y-2">
              {recentItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 rounded-2xl hover:bg-[#ECE7DC] transition-colors group cursor-pointer border border-transparent hover:border-[#E0DBD0]">
                  <div>
                    <p className="font-bold text-lg mb-1">{item.title}</p>
                    <p className="text-xs text-t-muted">{item.date} | <span className={item.type === 'Premium' ? 'text-t-copper' : 'text-t-copper'}>{item.type}</span></p>
                  </div>
                  <button className="text-sm bg-[#FFFDF9] px-4 py-2 rounded-xl text-[#121110] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ECE7DC]">수정</button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#FFFDF9] p-8 rounded-[18px] border border-[#E0DBD0]">
            <h3 className="text-2xl font-bold mb-8">CMS 빠른 실행</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-8 bg-[#E8481C]/10 rounded-3xl text-center hover:bg-[#E8481C]/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#E8481C]/5">
                <PlusCircle className="mx-auto mb-4 text-t-copper" size={36}/>
                <span className="text-base font-bold text-t-copper">새 악보 등록</span>
              </button>
              <button className="p-8 bg-[#FFFDF9] rounded-3xl text-center hover:bg-[#ECE7DC] transition-all hover:scale-105 active:scale-95 border border-[#E0DBD0]">
                <PenTool className="mx-auto mb-4 text-t-muted" size={36}/>
                <span className="text-base font-bold text-[#121110]">새 블로그 발행</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
