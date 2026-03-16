"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, Search, Trash2, Edit, ShieldAlert, CheckCircle, Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth';

export default function UsersManagementPage() {
  const { user } = useAuth();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    // In a real app, users usually come from Firebase Auth (Admin SDK) or a dedicated "users" collection.
    // Assuming we have a "users" collection synced with auth.
    const fetchUsers = async () => {
      try {
        const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(qUsers);
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">회원 관리 및 서포트 (CRM)</h1>
          <p className="text-gray-400 mt-2">웹사이트 가입 회원 현황 파악 및 이메일 마케팅 서포트 관리</p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-[#E6C79C] text-[#1A1817] hover:bg-[#D4B384]"
          >
            + 새 멤버 초대
          </Button>
          <Button className="flex items-center gap-2 border border-white/20 bg-transparent hover:bg-white/10 text-white">
            <Mail size={16} /> 뉴스레터 발송
          </Button>
        </div>
      </div>

      <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center bg-black/30 rounded-full px-4 border border-[#78716A]/20 w-full md:w-96 focus-within:border-[#E6C79C] transition-colors">
            <Search size={18} className="text-[#78716A]" />
            <input 
              type="text" 
              placeholder="회원 이메일, 이름, 직분으로 검색..." 
              className="bg-transparent border-none text-white px-3 py-3 w-full focus:outline-none placeholder:text-[#78716A]/60 text-sm"
            />
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto">필터: 최신 가입</Button>
            <Button variant="outline" className="w-full md:w-auto">역할: 유저</Button>
         </div>
      </Card>

      <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-black/30 text-xs uppercase border-b border-[#78716A]/20">
              <tr>
                <th className="px-6 py-4 font-bold text-[#E6C79C]">회원 정보</th>
                <th className="px-6 py-4 font-bold text-[#E6C79C]">상태/역할</th>
                <th className="px-6 py-4 font-bold text-[#E6C79C]">가입일</th>
                <th className="px-6 py-4 font-bold text-[#E6C79C]">최근 접속</th>
                <th className="px-6 py-4 font-bold text-[#E6C79C] text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#78716A]/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#78716A]">사용자 데이터를 불러오는 중...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-bold flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-200 text-[#2D2926] flex items-center justify-center font-bold">A</div>
                     <div>
                        <div>Admin User</div>
                        <div className="text-xs text-[#78716A] font-light">admin@ibigband.app</div>
                     </div>
                  </td>
                  <td className="px-6 py-4"><span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full w-fit text-xs font-bold"><Shield size={14}/>ADMIN</span></td>
                  <td className="px-6 py-4">2026-03-01</td>
                  <td className="px-6 py-4 text-[#78716A]">오늘</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#78716A] hover:text-[#E6C79C] p-2 transition-colors"><Edit size={16}/></button>
                    <button className="text-[#78716A] hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-bold flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-200 text-[#2D2926] flex items-center justify-center font-bold">
                         {(u.email || u.displayName || 'U')[0].toUpperCase()}
                       </div>
                       <div>
                          <div>{u.displayName || 'No Name'}</div>
                          <div className="text-xs text-[#78716A] font-light">{u.email}</div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full w-fit text-xs font-bold"><Shield size={14}/>ADMIN</span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full w-fit text-xs"><CheckCircle size={14}/>USER</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-[#78716A]">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#78716A] hover:text-[#E6C79C] p-2 transition-colors"><Edit size={16}/></button>
                      <button className="text-[#78716A] hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
                      {u.role !== 'admin' && <button className="text-[#78716A] hover:text-orange-400 p-2 transition-colors"><ShieldAlert size={16}/></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal Mockup */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#2D2926] p-8 rounded-2xl w-full max-w-md border border-white/10 relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#E6C79C] mb-2">새 멤버 초대</h2>
            <p className="text-white/60 mb-6">팀원의 이메일 주소를 입력하여, 셑리스트 및 라이브러리 접근 권한을 부여하세요.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">이메일 주소</label>
                <input 
                  type="email" 
                  placeholder="member@ibigband.com"
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">초대할 권한/역할</label>
                <select className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]">
                  <option value="user">일반 멤버 (셑리스트 조회 및 연습 기능)</option>
                  <option value="admin">관리자 (셑리스트 등록/수정, 예산 관리)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                 <button 
                   onClick={() => setShowInviteModal(false)}
                   className="px-4 py-2 rounded-lg text-white/60 hover:text-white font-medium"
                 >
                   취소
                 </button>
                 <button 
                   onClick={async () => {
                     try {
                        const idToken = await user?.getIdToken();
                        const response = await fetch('/api/admin/send-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                          },
                          body: JSON.stringify({
                            to: inviteEmail,
                            subject: 'IBIG Band 멤버로 초대합니다.',
                            html: `<p>안녕하세요,</p><p>IBIG Band 멤버로 초대합니다.</p><p>다음 링크를 클릭하여 가입해주세요: <a href="https://ibighome.com/setlist">ibighome.com/setlist</a></p>`,
                          }),
                        });
                        
                        if (response.ok) {
                          alert(`${inviteEmail} 님에게 초대 메일을 발송했습니다.`);
                          setShowInviteModal(false);
                          setInviteEmail('');
                        } else {
                          alert('초대 메일 발송에 실패했습니다.');
                        }
                     } catch (error) {
                        console.error('Email sending error:', error);
                        alert('오류가 발생했습니다.');
                     }
                   }}
                   className="bg-[#E6C79C] text-[#1A1817] px-6 py-2 rounded-lg font-bold hover:bg-[#D4B384] transition-colors"
                 >
                   초대 발송
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
