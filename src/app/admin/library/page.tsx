"use client";

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLibraryPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      alert("관리자 권한이 필요합니다.");
      router.push('/');
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.role !== 'admin') {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#E6C79C]">라이브러리 및 파일 공유 시스템</h1>
      </div>
      
      <div className="bg-[#2D2926] rounded-2xl p-8 border border-white/10 text-white/70">
        <p className="mb-4 text-lg text-white">데이터베이스 연동 파일 공유 시스템 대시보드입니다.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>구글 드라이브 통합 관리</li>
          <li>사용자별/그룹별 접근 권한 설정</li>
          <li>전체 악보, MP3, BGM, 영상 원본 통합 관리</li>
        </ul>
        <p className="mt-8 text-sm italic">현재 UI 목업 단계이며, 향후 DB 연동이 진행될 예정입니다.</p>
      </div>
    </div>
  );
}
