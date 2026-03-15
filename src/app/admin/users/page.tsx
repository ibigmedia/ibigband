"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, Search, Trash2, Edit, ShieldAlert, CheckCircle, Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function UsersManagementPage() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        <Button className="flex items-center gap-2">
          <Mail size={16} /> 전체 회원 뉴스레터 발송
        </Button>
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
    </div>
  );
}
