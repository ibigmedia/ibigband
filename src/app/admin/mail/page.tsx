"use client";

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminMailPage() {
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

  const [recipient, setRecipient] = useState('all');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const handleSend = () => {
    alert("이메일 발송 목업 테스트.\n[수신]: " + recipient + "\n[제목]: " + subject);
    // 실제로는 여기에 fetch('/api/send-mail', ...) (Resend 등) 코드가 들어갑니다.
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#E6C79C]">이메일 및 보고서 발송</h1>
          <p className="text-white/60 mt-2">팀원, 외부 초청 스피커 등에게 시스템 메일을 전송합니다.</p>
        </div>
      </div>
      
      <div className="bg-[#2D2926] rounded-2xl p-8 border border-white/5 space-y-6">
        
        <div className="space-y-2">
          <label className="text-sm text-white/60 font-medium">수신자 그룹</label>
          <select 
            className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="all">밴드 멤버 전체 (등록된 모든 유저)</option>
            <option value="vocal">보컬 파트</option>
            <option value="band">악기 파트 (밴드)</option>
            <option value="engineers">음향/미디어 엔진지어</option>
            <option value="admin">임원진 및 관리자</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60 font-medium">이메일 제목</label>
          <input 
            type="text" 
            placeholder="[알림] 이번 주일 콘티 및 스케줄 브리핑"
            className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60 font-medium">내용 및 셑리스트 요약 (HTML 지원)</label>
          <textarea 
            rows={10}
            placeholder="여기에 팀원들에게 전할 메시지, 또는 집회 결산 보고 내용을 작성하세요..."
            className="w-full bg-[#1A1817] border border-white/10 text-white p-4 rounded-lg focus:outline-none focus:border-[#E6C79C] resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-white/5">
           <p className="text-xs text-white/40">ⓘ 이메일 발송 엔진은 Resend API 연동을 통해 전송될 예정입니다.</p>
           <button 
             onClick={handleSend}
             className="bg-[#E6C79C] text-[#1A1817] px-8 py-3 rounded-lg font-bold hover:bg-[#D4B384] transition-colors"
           >
             메일 보내기
           </button>
        </div>
      </div>
    </div>
  );
}
