"use client";

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export default function AdminBudgetPage() {
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

  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '식비',
    detail: '',
    applicant: user?.displayName || '',
    amount: '',
    status: 'approved' // Default to approved for admin for now
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hardcoded total budget for now, could be fetched from DB
  const TOTAL_BUDGET = 12000000;

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  };

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      fetchTransactions();
      if (!formData.applicant && user.displayName) {
        setFormData(prev => ({ ...prev, applicant: user.displayName! }));
      }
    }
  }, [user, userData]);

  const ytdSpent = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const remaining = TOTAL_BUDGET - ytdSpent;

  const handleSave = async () => {
    if (!formData.detail || !formData.amount) {
      alert("상세 내역과 금액을 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...formData,
        amount: Number(formData.amount),
        createdAt: new Date().toISOString()
      });
      alert('저장되었습니다.');
      setShowModal(false);
      setFormData(prev => ({ ...prev, detail: '', amount: '' }));
      fetchTransactions();
    } catch (error) {
      console.error("Error saving transaction: ", error);
      alert('오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'transactions', id), { status: newStatus });
      fetchTransactions();
    } catch (error) {
      console.error("Error updating status: ", error);
      alert("상태 변경 오류");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 내역을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(num);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#E6C79C]">예산 및 재정 관리</h1>
          <p className="text-white/60 mt-2">2026년 상반기 찬양팀 예산 현황 및 지출 내역</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#E6C79C] text-[#1A1817] px-6 py-3 rounded-lg font-bold hover:bg-[#D4B384] transition-colors flex items-center gap-2"
        >
          새 지출결의서 작성
        </button>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2D2926] p-6 rounded-2xl border border-white/5">
          <p className="text-white/60 text-sm mb-2">올해 총 예산</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(TOTAL_BUDGET)}</p>
          <p className="text-sm text-green-400 mt-2">운영 위원회 배정 예산</p>
        </div>
        <div className="bg-[#2D2926] p-6 rounded-2xl border border-white/5">
          <p className="text-white/60 text-sm mb-2">현재까지 집행액 (YTD)</p>
          <p className="text-3xl font-bold text-[#E6C79C]">{formatCurrency(ytdSpent)}</p>
          <p className="text-sm text-yellow-500 mt-2">예산 대비 {((ytdSpent/TOTAL_BUDGET)*100).toFixed(1)}% 소진</p>
        </div>
        <div className="bg-[#2D2926] p-6 rounded-2xl border border-white/5">
          <p className="text-white/60 text-sm mb-2">잔여 예산</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(remaining)}</p>
          <p className="text-sm text-white/40 mt-2">안정적인 진행 중</p>
        </div>
      </div>

      {/* Transactions Table Mockup */}
      <div className="bg-[#2D2926] rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex gap-6 p-6 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[#E6C79C] text-[#E6C79C]' : 'border-transparent text-white/50 hover:text-white'}`}
          >
            최근 집행 내역
          </button>
        </div>
        
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/60 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">날짜</th>
                <th className="p-4 font-medium">카테고리</th>
                <th className="p-4 font-medium">세부 내역</th>
                <th className="p-4 font-medium">신청자</th>
                <th className="p-4 font-medium">제출 금액</th>
                <th className="p-4 font-medium">상태</th>
                <th className="p-4 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {transactions.length > 0 ? transactions.map((t, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-white/80">{t.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs
                      ${t.category === '장비 구매' || t.category === '장비' ? 'bg-blue-500/20 text-blue-300' : ''}
                      ${t.category === '식비' ? 'bg-purple-500/20 text-purple-300' : ''}
                      ${t.category === '라이선스' ? 'bg-[#E6C79C]/20 text-[#E6C79C]' : ''}
                      ${t.category === '사역' || t.category === '사역비' ? 'bg-green-500/20 text-green-300' : ''}
                    `}>
                      {t.category}
                    </span>
                  </td>
                  <td className="p-4 text-white font-medium">{t.detail}</td>
                  <td className="p-4 text-white/80">{t.applicant}</td>
                  <td className="p-4 text-white font-bold">{formatCurrency(t.amount)}</td>
                  <td className="p-4">
                    <select 
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded font-bold appearance-none bg-transparent cursor-pointer
                        ${t.status === 'approved' ? 'text-green-400 bg-green-400/10' : ''}
                        ${t.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' : ''}
                        ${t.status === 'rejected' ? 'text-red-400 bg-red-400/10' : ''}
                      `}
                    >
                      <option value="pending" className="bg-[#2D2926] text-yellow-400">대기 중</option>
                      <option value="approved" className="bg-[#2D2926] text-green-400">승인됨</option>
                      <option value="rejected" className="bg-[#2D2926] text-red-400">거절됨</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      className="text-red-400/50 hover:text-red-400 transition-colors"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/50">데이터가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Write Exependiture Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#2D2926] p-8 rounded-2xl w-full max-w-lg border border-white/10 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#E6C79C] mb-6">새 지출결의서 작성</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">날짜</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">카테고리</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]">
                    <option value="식비" className="text-white">식비 (운영)</option>
                    <option value="장비" className="text-white">장비 구매 및 수리</option>
                    <option value="악보/라이선스" className="text-white">라이선스 (악보 등)</option>
                    <option value="사역비" className="text-white">사역 지원 / 외부 강사</option>
                    <option value="기타" className="text-white">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">세부 내역</label>
                <input 
                  type="text" 
                  value={formData.detail}
                  onChange={(e) => setFormData({...formData, detail: e.target.value})}
                  placeholder="무엇을 구매 또는 지출하셨나요?"
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">제출 금액 (원)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="25000"
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">신청자</label>
                  <input 
                    type="text" 
                    value={formData.applicant}
                    onChange={(e) => setFormData({...formData, applicant: e.target.value})}
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">초기 상태 처리</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]">
                  <option value="pending" className="text-white">대기 중 (승인 요망)</option>
                  <option value="approved" className="text-white">승인됨 (결제 완료)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                 <button 
                   onClick={() => setShowModal(false)}
                   className="px-4 py-2 rounded-lg text-white/60 hover:text-white font-medium"
                 >
                   취소
                 </button>
                 <button 
                   onClick={handleSave}
                   disabled={isSubmitting}
                   className="bg-[#E6C79C] text-[#1A1817] px-6 py-2 rounded-lg font-bold hover:bg-[#D4B384] transition-colors disabled:opacity-50"
                 >
                   {isSubmitting ? '저장 중...' : '지출결의서 제출'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
