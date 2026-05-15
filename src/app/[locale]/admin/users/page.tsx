"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Mail, Search, Shield, Clock, XCircle, CheckCircle, UserCheck, UserX,
  Send, X, Users, Crown, AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  MoreHorizontal, MessageSquare, Loader2
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth';

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(ts: any): string {
  if (!ts) return '-';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) {
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return '방금 전';
    return `${hrs}시간 전`;
  }
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [emailModal, setEmailModal] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [expandedPending, setExpandedPending] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(qUsers);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async (uid: string, displayName?: string) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: 'approved' } : u));
      if (selectedUser?.id === uid) setSelectedUser((p: any) => ({ ...p, status: 'approved' }));
      showToast(`${displayName || '회원'} 승인 완료`);
    } catch { showToast('승인 처리 실패', 'error'); }
    setActionLoading(null);
  };

  const handleReject = async (uid: string, displayName?: string) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: 'rejected' } : u));
      if (selectedUser?.id === uid) setSelectedUser((p: any) => ({ ...p, status: 'rejected' }));
      showToast(`${displayName || '회원'} 거절 처리됨`);
    } catch { showToast('거절 처리 실패', 'error'); }
    setActionLoading(null);
  };

  const handleChangeGrade = async (uid: string, grade: 'basic' | 'member' | 'admin') => {
    setActionLoading(uid);
    const gradeLabel = grade === 'admin' ? '관리자' : grade === 'member' ? '밴드멤버' : '기본회원';
    const role = grade === 'admin' ? 'admin' : 'user';
    try {
      await updateDoc(doc(db, 'users', uid), { grade, role });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, grade, role } : u));
      if (selectedUser?.id === uid) setSelectedUser((p: any) => ({ ...p, grade, role }));
      showToast(`등급 변경: ${gradeLabel}`);
    } catch { showToast('등급 변경 실패', 'error'); }
    setActionLoading(null);
  };

  const handleTogglePremium = async (uid: string, current: boolean) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { isPremium: !current });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, isPremium: !current } : u));
      if (selectedUser?.id === uid) setSelectedUser((p: any) => ({ ...p, isPremium: !current }));
      showToast(!current ? '프리미엄 부여 완료' : '프리미엄 해제');
    } catch { showToast('프리미엄 변경 실패', 'error'); }
    setActionLoading(null);
  };

  const handleSendEmail = async () => {
    if (!emailModal || !emailSubject.trim() || !emailBody.trim()) return;
    setEmailSending(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          to: emailModal.email,
          subject: emailSubject,
          html: `
            <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e2dd;">
              <div style="background:#2D2926;padding:24px 32px;text-align:center;">
                <span style="font-size:24px;font-weight:bold;color:#E6C79C;">ibiGband</span>
              </div>
              <div style="padding:32px;">
                <p style="color:#2D2926;font-size:15px;line-height:1.7;margin:0;">${emailBody.replace(/\n/g, '<br/>')}</p>
              </div>
              <div style="padding:16px 32px;background:#f5f4f0;text-align:center;border-top:1px solid #e5e2dd;">
                <p style="color:#78716A;font-size:11px;margin:0;">&copy; ibiGband · Contemporary Warmth Archive</p>
              </div>
            </div>`,
        }),
      });
      if (res.ok) {
        showToast(`${emailModal.displayName || emailModal.email}에게 이메일 발송 완료`);
        setEmailModal(null);
        setEmailSubject('');
        setEmailBody('');
      } else {
        showToast('이메일 발송 실패', 'error');
      }
    } catch { showToast('이메일 발송 실패', 'error'); }
    setEmailSending(false);
  };

  const handleSaveNote = async () => {
    if (!selectedUser || !noteText.trim()) return;
    setNoteSaving(true);
    try {
      await addDoc(collection(db, 'users', selectedUser.id, 'notes'), {
        text: noteText.trim(),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });
      const currentNotes = selectedUser.notes || [];
      const updated = { ...selectedUser, notes: [...currentNotes, { text: noteText.trim(), createdAt: new Date() }] };
      setSelectedUser(updated);
      setNoteText('');
      showToast('메모 저장 완료');
    } catch { showToast('메모 저장 실패', 'error'); }
    setNoteSaving(false);
  };

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const filteredUsers = useMemo(() => {
    let list = filter === 'all' ? users : users.filter(u => u.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: users.length,
    approved: users.filter(u => u.status === 'approved' || (!u.status && u.role)).length,
    pending: pendingUsers.length,
    rejected: users.filter(u => u.status === 'rejected').length,
    premium: users.filter(u => u.isPremium).length,
    admin: users.filter(u => u.role === 'admin' || u.grade === 'admin').length,
    member: users.filter(u => u.grade === 'member').length,
    basic: users.filter(u => !u.grade || u.grade === 'basic').length,
  }), [users, pendingUsers]);

  return (
    <div className="space-y-6">
      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">회원 관리</h1>
          <p className="text-gray-400 mt-1 text-sm">총 {stats.total}명 · 승인 {stats.approved} · 대기 {stats.pending} · 프리미엄 {stats.premium}</p>
        </div>
        <button onClick={() => { setLoading(true); fetchUsers(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors">
          <RefreshCw size={14} /> 새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '전체 회원', value: stats.total, icon: <Users size={18} />, color: 'text-white', bg: 'bg-white/10' },
          { label: '승인 대기', value: stats.pending, icon: <Clock size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', onClick: () => setFilter('pending') },
          { label: '밴드멤버', value: stats.member, icon: <Users size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: '관리자', value: stats.admin, icon: <Shield size={18} />, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: '프리미엄', value: stats.premium, icon: <Crown size={18} />, color: 'text-[#E6C79C]', bg: 'bg-[#E6C79C]/10' },
        ].map(s => (
          <button key={s.label} onClick={s.onClick} className={`${s.bg} border border-[#78716A]/10 rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${s.onClick ? 'cursor-pointer' : ''}`}>
            <div className={`flex items-center gap-2 ${s.color} mb-2`}>{s.icon}<span className="text-xs font-bold">{s.label}</span></div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* 승인 대기 섹션 — 항상 상단에 */}
      {pendingUsers.length > 0 && (
        <Card className="bg-yellow-500/5 border border-yellow-500/20 overflow-hidden">
          <button onClick={() => setExpandedPending(!expandedPending)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-yellow-500/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle size={16} className="text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">승인 대기 {pendingUsers.length}명</p>
                <p className="text-yellow-400/60 text-xs">가입 신청을 검토하고 승인/거절하세요</p>
              </div>
            </div>
            {expandedPending ? <ChevronUp size={18} className="text-yellow-400" /> : <ChevronDown size={18} className="text-yellow-400" />}
          </button>

          {expandedPending && (
            <div className="border-t border-yellow-500/10 divide-y divide-yellow-500/10">
              {pendingUsers.map(u => (
                <div key={u.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                  {/* 프로필 */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold shrink-0 text-sm">
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm truncate">{u.displayName || 'No Name'}</p>
                      <p className="text-[#78716A] text-xs truncate">{u.email}</p>
                      {u.bio && (
                        <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 bg-black/20 rounded-lg px-3 py-2">{u.bio}</p>
                      )}
                      <p className="text-[#78716A] text-[11px] mt-1">가입: {formatDate(u.createdAt)}</p>
                    </div>
                  </div>
                  {/* 액션 */}
                  <div className="flex items-center gap-2 shrink-0 md:ml-auto">
                    <button
                      onClick={() => handleApprove(u.id, u.displayName)}
                      disabled={actionLoading === u.id}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {actionLoading === u.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} 승인
                    </button>
                    <button
                      onClick={() => handleReject(u.id, u.displayName)}
                      disabled={actionLoading === u.id}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      <UserX size={14} /> 거절
                    </button>
                    <button onClick={() => setEmailModal(u)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#E6C79C] rounded-xl transition-colors" title="이메일 보내기">
                      <Mail size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 검색 + 필터 */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center bg-[#2D2926]/50 border border-[#78716A]/20 rounded-xl px-4 flex-1 focus-within:border-[#E6C79C] transition-colors">
          <Search size={16} className="text-[#78716A] shrink-0" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="이름, 이메일, 자기소개로 검색..."
            className="bg-transparent text-white px-3 py-3 w-full focus:outline-none placeholder:text-[#78716A]/60 text-sm" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#78716A] hover:text-white p-1"><X size={14} /></button>
          )}
        </div>
        <div className="flex items-center gap-1.5 bg-[#2D2926]/50 border border-[#78716A]/20 rounded-xl p-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-[#E6C79C] text-[#2D2926] shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}>
              {f === 'all' ? `전체 (${stats.total})` : f === 'pending' ? `대기 (${stats.pending})` : f === 'approved' ? `승인 (${stats.approved})` : `거절 (${stats.rejected})`}
            </button>
          ))}
        </div>
      </div>

      {/* 회원 목록 + 상세 패널 (2열 레이아웃) */}
      <div className="flex gap-6">
        {/* 회원 목록 */}
        <div className={`flex-1 min-w-0 space-y-2 ${selectedUser ? 'hidden md:block md:max-w-[55%]' : ''}`}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#78716A]">
              <Loader2 size={20} className="animate-spin mr-2" /> 회원 데이터를 불러오는 중...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-[#78716A] text-sm">
              {searchQuery ? '검색 결과가 없습니다' : '해당 상태의 회원이 없습니다'}
            </div>
          ) : (
            filteredUsers.map(u => (
              <button key={u.id} onClick={() => setSelectedUser(u)}
                className={`w-full text-left rounded-xl border transition-all ${
                  selectedUser?.id === u.id
                    ? 'bg-[#E6C79C]/10 border-[#E6C79C]/30'
                    : 'bg-[#2D2926]/50 border-[#78716A]/10 hover:border-[#78716A]/30 hover:bg-[#2D2926]/70'
                } p-4`}>
                <div className="flex items-center gap-3">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm ${
                      u.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                      : u.role === 'admin' ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#78716A]/20 text-[#78716A]'
                    }`}>
                      {(u.displayName || u.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm truncate">{u.displayName || 'No Name'}</span>
                      {(u.grade === 'admin' || u.role === 'admin') && <Shield size={12} className="text-green-400 shrink-0" />}
                      {u.grade === 'member' && <Users size={12} className="text-purple-400 shrink-0" />}
                      {u.isPremium && <Crown size={12} className="text-[#E6C79C] shrink-0" />}
                    </div>
                    <p className="text-[#78716A] text-xs truncate">{u.email}</p>
                  </div>
                  <div className="shrink-0">
                    {u.status === 'pending' ? (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[11px] font-bold">대기</span>
                    ) : u.status === 'rejected' ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[11px] font-bold">거절</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[11px] font-bold">승인</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 상세 패널 */}
        {selectedUser && (
          <div className={`${selectedUser ? 'fixed inset-0 z-50 bg-black/60 md:relative md:inset-auto md:z-auto md:bg-transparent' : ''} md:w-[45%] md:min-w-[380px]`}>
            <Card className="bg-[#2D2926] border border-[#78716A]/20 overflow-hidden h-full md:h-auto md:sticky md:top-4 md:max-h-[calc(100vh-120px)] overflow-y-auto
              fixed inset-4 md:relative md:inset-auto z-50 md:z-auto">
              {/* 닫기 */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#78716A]/10 bg-black/20">
                <span className="text-xs text-[#78716A] font-bold uppercase tracking-wider">회원 상세</span>
                <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* 프로필 헤더 */}
              <div className="p-5 border-b border-[#78716A]/10">
                <div className="flex items-center gap-4">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
                      selectedUser.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                      : selectedUser.role === 'admin' ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#78716A]/20 text-[#78716A]'
                    }`}>
                      {(selectedUser.displayName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{selectedUser.displayName || 'No Name'}</h3>
                    <p className="text-[#78716A] text-sm truncate">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* 등급 배지 */}
                      {(selectedUser.grade === 'admin' || selectedUser.role === 'admin') ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[11px] font-bold"><Shield size={10} />관리자</span>
                      ) : selectedUser.grade === 'member' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-[11px] font-bold"><Users size={10} />밴드멤버</span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-[11px] font-bold"><Users size={10} />기본회원</span>
                      )}
                      {selectedUser.isPremium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-[#E6C79C]/20 text-[#E6C79C] rounded-full text-[11px] font-bold"><Crown size={10} />프리미엄</span>
                      )}
                      {/* 승인 상태 */}
                      {selectedUser.status === 'pending' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[11px] font-bold"><Clock size={10} />승인 대기</span>
                      )}
                      {selectedUser.status === 'rejected' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[11px] font-bold"><XCircle size={10} />거절됨</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 승인/거절 액션 (대기 상태일 때) */}
              {selectedUser.status === 'pending' && (
                <div className="px-5 py-4 border-b border-[#78716A]/10 bg-yellow-500/5">
                  <p className="text-yellow-400 text-xs font-bold mb-3">이 회원의 가입 신청을 검토하세요</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(selectedUser.id, selectedUser.displayName)}
                      disabled={actionLoading === selectedUser.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {actionLoading === selectedUser.id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />} 승인하기
                    </button>
                    <button onClick={() => handleReject(selectedUser.id, selectedUser.displayName)}
                      disabled={actionLoading === selectedUser.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      <UserX size={14} /> 거절하기
                    </button>
                  </div>
                </div>
              )}

              {/* 자기소개 */}
              {selectedUser.bio && (
                <div className="px-5 py-4 border-b border-[#78716A]/10">
                  <p className="text-[#78716A] text-xs font-bold uppercase tracking-wider mb-2">자기소개</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-black/20 rounded-xl p-3">
                    {selectedUser.bio}
                  </p>
                </div>
              )}

              {/* 상세 정보 */}
              <div className="px-5 py-4 border-b border-[#78716A]/10">
                <p className="text-[#78716A] text-xs font-bold uppercase tracking-wider mb-3">회원 정보</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#78716A]">UID</span>
                    <span className="text-gray-400 font-mono text-xs">{selectedUser.id.slice(0, 16)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716A]">가입일</span>
                    <span className="text-gray-300">{formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716A]">상태</span>
                    <span className="text-gray-300">{selectedUser.status === 'pending' ? '승인 대기' : selectedUser.status === 'rejected' ? '거절됨' : '승인됨'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716A]">등급</span>
                    <span className="text-gray-300">{(selectedUser.grade === 'admin' || selectedUser.role === 'admin') ? '관리자' : selectedUser.grade === 'member' ? '밴드멤버' : '기본회원'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#78716A]">프리미엄</span>
                    <span className="text-gray-300">{selectedUser.isPremium ? '예' : '아니오'}</span>
                  </div>
                </div>
              </div>

              {/* 등급 변경 */}
              {selectedUser.status === 'approved' && (
                <div className="px-5 py-4 border-b border-[#78716A]/10">
                  <p className="text-[#78716A] text-xs font-bold uppercase tracking-wider mb-3">회원 등급</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { grade: 'basic' as const, label: '기본회원', icon: <Users size={14} />, color: 'gray', desc: '기본 접근' },
                      { grade: 'member' as const, label: '밴드멤버', icon: <Users size={14} />, color: 'purple', desc: '멤버 전용 기능' },
                      { grade: 'admin' as const, label: '관리자', icon: <Shield size={14} />, color: 'green', desc: '전체 관리 권한' },
                    ]).map(g => {
                      const currentGrade = selectedUser.grade || (selectedUser.role === 'admin' ? 'admin' : 'basic');
                      const isActive = currentGrade === g.grade;
                      return (
                        <button key={g.grade}
                          onClick={() => !isActive && handleChangeGrade(selectedUser.id, g.grade)}
                          disabled={isActive || actionLoading === selectedUser.id}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold transition-all ${
                            isActive
                              ? g.color === 'green' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40'
                                : g.color === 'purple' ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40'
                                : 'bg-white/10 text-white ring-1 ring-white/20'
                              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                          } disabled:cursor-default`}
                        >
                          {g.icon}
                          <span>{g.label}</span>
                          {isActive && <span className="text-[10px] opacity-60">현재</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 관리 액션 */}
              <div className="px-5 py-4 border-b border-[#78716A]/10">
                <p className="text-[#78716A] text-xs font-bold uppercase tracking-wider mb-3">관리 액션</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setEmailModal(selectedUser)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">
                    <Mail size={13} /> 이메일 보내기
                  </button>
                  {selectedUser.status === 'approved' && (
                    <button onClick={() => handleTogglePremium(selectedUser.id, selectedUser.isPremium)}
                      disabled={actionLoading === selectedUser.id}
                      className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                      <Crown size={13} /> {selectedUser.isPremium ? '프리미엄 해제' : '프리미엄 부여'}
                    </button>
                  )}
                  {selectedUser.status === 'rejected' && (
                    <button onClick={() => handleApprove(selectedUser.id, selectedUser.displayName)}
                      disabled={actionLoading === selectedUser.id}
                      className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                      <UserCheck size={13} /> 승인으로 변경
                    </button>
                  )}
                  {selectedUser.status === 'approved' && (selectedUser.grade !== 'admin' && selectedUser.role !== 'admin') && (
                    <button onClick={() => handleReject(selectedUser.id, selectedUser.displayName)}
                      disabled={actionLoading === selectedUser.id}
                      className="flex items-center justify-center gap-2 py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                      <UserX size={13} /> 접근 차단
                    </button>
                  )}
                </div>
              </div>

              {/* 관리자 메모 */}
              <div className="px-5 py-4">
                <p className="text-[#78716A] text-xs font-bold uppercase tracking-wider mb-3">관리자 메모</p>
                <div className="flex gap-2">
                  <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="이 회원에 대한 메모 작성..."
                    onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                    className="flex-1 bg-black/20 border border-[#78716A]/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#78716A]/50 focus:outline-none focus:border-[#E6C79C]" />
                  <button onClick={handleSaveNote} disabled={noteSaving || !noteText.trim()}
                    className="px-3 py-2 bg-[#E6C79C] text-[#2D2926] rounded-xl text-xs font-bold hover:bg-[#D4B384] transition-colors disabled:opacity-50">
                    {noteSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
                {selectedUser.notes && selectedUser.notes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedUser.notes.map((n: any, i: number) => (
                      <div key={i} className="bg-black/20 rounded-lg px-3 py-2 text-xs text-gray-400">
                        <p className="text-gray-300">{n.text}</p>
                        <p className="text-[#78716A] text-[10px] mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 이메일 발송 모달 */}
      {emailModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={() => setEmailModal(null)}>
          <div className="bg-[#2D2926] border border-[#78716A]/20 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#78716A]/10">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail size={18} className="text-[#E6C79C]" /> 이메일 보내기
                </h2>
                <p className="text-xs text-[#78716A] mt-1">수신: {emailModal.displayName} ({emailModal.email})</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">제목</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                  placeholder="이메일 제목을 입력하세요"
                  className="w-full bg-black/30 border border-[#78716A]/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E6C79C]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">내용</label>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                  placeholder="이메일 내용을 입력하세요..."
                  rows={6}
                  className="w-full bg-black/30 border border-[#78716A]/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#E6C79C] resize-none" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 text-xs text-[#78716A]">
                  발신: hello@ibighome.com · ibiGband 브랜딩 적용
                </div>
                <button onClick={() => setEmailModal(null)} className="px-4 py-2.5 text-gray-400 hover:text-white text-sm font-bold">취소</button>
                <button onClick={handleSendEmail} disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#E6C79C] text-[#2D2926] rounded-xl text-sm font-bold hover:bg-[#D4B384] transition-colors disabled:opacity-50">
                  {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} 발송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
