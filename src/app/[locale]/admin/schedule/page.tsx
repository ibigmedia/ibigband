"use client";

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default function AdminSchedulePage() {
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

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEventModal, setShowEventModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schedules, setSchedules] = useState<any[]>([]);

  const fetchSchedules = async () => {
    try {
      const q = query(collection(db, 'schedules'), orderBy('date', 'asc'), orderBy('time', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules: ", err);
    }
  };

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      fetchSchedules();
    }
  }, [user, userData]);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('service');
  const [eventTarget, setEventTarget] = useState('all');
  const [eventMemo, setEventMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEvent = async () => {
    if (!eventTitle || !eventDate || !eventTime) {
      alert("일정 제목, 날짜, 시간을 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'schedules'), {
        title: eventTitle,
        date: eventDate,
        time: eventTime,
        type: eventType,
        target: eventTarget,
        memo: eventMemo,
        createdAt: new Date().toISOString()
      });
      alert('일정이 등록되었습니다.');
      setShowEventModal(false);
      
      // form 초기화
      setEventTitle('');
      setEventDate('');
      setEventTime('');
      setEventType('service');
      setEventTarget('all');
      setEventMemo('');
      
      // 목록 리프레시
      fetchSchedules();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('일정 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#E6C79C]">전체 일정 및 캘린더 관리</h1>
          <p className="text-white/60 mt-2">집회, 파트별 연습 및 전체 리허설 일정 조율</p>
        </div>
        <button 
          onClick={() => setShowEventModal(true)}
          className="bg-[#E6C79C] text-[#1A1817] px-6 py-3 rounded-lg font-bold hover:bg-[#D4B384] transition-colors flex items-center gap-2"
        >
          새 일정 등록
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Interactive Calendar (Mockup) */}
        <div className="lg:col-span-2 bg-[#2D2926] rounded-2xl p-6 border border-white/5">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white">2026년 3월</h2>
             <div className="flex gap-2">
               <button className="px-3 py-1 bg-black/20 rounded hover:bg-black/40 text-white">&lt;</button>
               <button className="px-3 py-1 bg-black/20 rounded hover:bg-black/40 text-white">&gt;</button>
             </div>
           </div>
           
           <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold text-white/50 mb-4">
             <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
           </div>
           <div className="grid grid-cols-7 gap-2">
             {Array.from({ length: 31 }).map((_, i) => (
               <div 
                 key={i} 
                 onClick={() => setSelectedDate(`2026-03-${String(i + 1).padStart(2, '0')}`)}
                 className={`aspect-square p-2 rounded-lg border transition-colors cursor-pointer flex flex-col items-center justify-center relative
                   ${selectedDate === `2026-03-${String(i + 1).padStart(2, '0')}` ? 'border-[#E6C79C] bg-[#E6C79C]/10 text-[#E6C79C]' : 'border-white/5 hover:border-white/20 text-white/80'}
                 `}
               >
                 <span className="font-medium">{i + 1}</span>
                 {/* Show indicators for events on this date */}
                 {schedules.filter(s => s.date === `2026-03-${String(i + 1).padStart(2, '0')}`).map((_, idx) => (
                   <span key={idx} className="w-1.5 h-1.5 bg-[#E6C79C] rounded-full mt-1"></span>
                 ))}
               </div>
             ))}
           </div>
        </div>

        {/* Right: Selected Date Schedule Timeline */}
        <div className="bg-[#2D2926] rounded-2xl p-6 border border-white/5 h-fit">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">
            {selectedDate} 상세 일정
          </h3>

          <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-8">
            {schedules.filter(s => s.date === selectedDate).length > 0 ? (
              schedules.filter(s => s.date === selectedDate).map((schedule, idx) => (
                <div className="relative" key={idx}>
                  <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-[#E6C79C] border-4 border-[#2D2926]"></div>
                  <p className="text-sm font-bold text-[#E6C79C]">{schedule.time}</p>
                  <h4 className="font-bold text-white text-lg mt-1">{schedule.title}</h4>
                  <p className="text-sm text-white/50">{schedule.memo}</p>
                  <p className="text-xs text-white/30 mt-1">대상: {schedule.target} | 유형: {schedule.type}</p>
                </div>
              ))
            ) : (
              <p className="text-white/50">선택된 날짜에 일정이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Registration Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#2D2926] p-8 rounded-2xl w-full max-w-lg border border-white/10 relative">
            <button 
              onClick={() => setShowEventModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#E6C79C] mb-6">새 일정 등록</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">일정 제목</label>
                <input 
                  type="text" 
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="예: 주일 2부 예배 리허설"
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">날짜</label>
                  <input 
                    type="date" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 font-medium block mb-2">시간</label>
                  <input 
                    type="time" 
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">일정 구분</label>
                <select 
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]">
                  <option value="service" className="text-white">집회 / 예배 일정</option>
                  <option value="practice" className="text-white">연습 일정</option>
                  <option value="rehearsal" className="text-white">리허설 시간</option>
                  <option value="travel" className="text-white">이동 시간</option>
                  <option value="other" className="text-white">기타</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">참석 대상</label>
                <select 
                  value={eventTarget}
                  onChange={(e) => setEventTarget(e.target.value)}
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]">
                  <option value="all">전체 팀원</option>
                  <option value="vocal">보컬 파트</option>
                  <option value="band">밴드 파트</option>
                  <option value="engineer">엔지니어</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white/60 font-medium block mb-2">메모 / 장소</label>
                <textarea 
                  value={eventMemo}
                  onChange={(e) => setEventMemo(e.target.value)}
                  placeholder="장소나 특별한 준비물을 적어주세요."
                  rows={3}
                  className="w-full bg-[#1A1817] border border-white/10 text-white p-3 rounded-lg focus:outline-none focus:border-[#E6C79C]"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                 <button 
                   onClick={() => setShowEventModal(false)}
                   className="px-4 py-2 rounded-lg text-white/60 hover:text-white font-medium"
                 >
                   취소
                 </button>
                 <button 
                   onClick={handleSaveEvent}
                   disabled={isSubmitting}
                   className="bg-[#E6C79C] text-[#1A1817] px-6 py-2 rounded-lg font-bold hover:bg-[#D4B384] transition-colors disabled:opacity-50"
                 >
                   {isSubmitting ? '저장 중...' : '일정 저장'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
