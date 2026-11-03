"use client";

import { useState } from 'react';
import { X, Mail, Loader2, Paperclip, Check, FileText, Printer, Calendar } from 'lucide-react';

interface SetlistItem {
  type: string;
  title: string;
  author?: string;
  duration?: string;
  note?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  setlistTitle: string;
  items: SetlistItem[];
  totalDuration: string;
  schedules: { time: string; title: string; type: string; date?: string; location?: string; memo?: string }[];
  onSend: (params: {
    to: string[];
    includeOverview: boolean;
    includeCueSheet: boolean;
    includeMasterPdf: boolean;
    includeSchedule: boolean;
  }) => Promise<void>;
}

export default function EmailShareModal({ isOpen, onClose, setlistTitle, items, totalDuration, schedules, onSend }: Props) {
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);

  // Attachment toggles
  const [includeOverview, setIncludeOverview] = useState(true);
  const [includeCueSheet, setIncludeCueSheet] = useState(true);
  const [includeMasterPdf, setIncludeMasterPdf] = useState(true);
  const [includeSchedule, setIncludeSchedule] = useState(false);

  const handleSend = async () => {
    const emails = emailTo.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      alert('수신자 이메일을 입력해주세요.');
      return;
    }
    setSending(true);
    try {
      await onSend({ to: emails, includeOverview, includeCueSheet, includeMasterPdf, includeSchedule });
      alert('이메일이 전송되었습니다!');
      setEmailTo('');
      onClose();
    } catch (e: any) {
      alert('전송 실패: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { sheet: '악보', mr: 'MR', bgm: 'BGM', transcript: '멘트/원고', guide: '가이드' };
    return map[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl flex items-center gap-2"><Mail className="text-t-gold" /> 이메일 공유</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Recipients */}
          <div>
            <label className="text-sm font-bold text-[#121110] block mb-2">수신자 (콤마로 구분)</label>
            <input
              type="text" value={emailTo} onChange={e => setEmailTo(e.target.value)}
              placeholder="member1@email.com, member2@email.com"
              className="w-full bg-[#F5F2EC] border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121110]"
            />
          </div>

          {/* Preview */}
          <div className="bg-[#F5F2EC] rounded-xl p-4">
            <p className="font-bold text-[#121110] mb-1">{setlistTitle}</p>
            <p className="text-xs text-t-muted mb-2">{items.length}곡 · 예상 시간 {totalDuration}</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {items.map((item, i) => (
                <p key={i} className="text-xs text-t-muted">
                  {i + 1}. <span className="font-bold text-[#121110]">{item.title}</span> {item.author ? `(${item.author})` : ''} <span className="text-t-gold">{getTypeLabel(item.type)}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Attachment options */}
          <div>
            <p className="text-sm font-bold text-[#121110] mb-3 flex items-center gap-1.5"><Paperclip size={14} /> 첨부 내용 선택</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-[#F5F2EC] rounded-xl cursor-pointer hover:bg-[#E8481C]/10 transition-colors">
                <input type="checkbox" checked={includeOverview} onChange={e => setIncludeOverview(e.target.checked)} className="accent-[#121110] w-4 h-4" />
                <Mail size={16} className="text-t-muted" />
                <div>
                  <p className="text-sm font-bold text-[#121110]">셋리스트 개요</p>
                  <p className="text-[13px] text-t-muted">곡 목록, 아티스트, 시간 등 HTML 테이블</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#F5F2EC] rounded-xl cursor-pointer hover:bg-[#E8481C]/10 transition-colors">
                <input type="checkbox" checked={includeCueSheet} onChange={e => setIncludeCueSheet(e.target.checked)} className="accent-[#121110] w-4 h-4" />
                <FileText size={16} className="text-t-muted" />
                <div>
                  <p className="text-sm font-bold text-[#121110]">큐시트 PDF</p>
                  <p className="text-[13px] text-t-muted">스타일 적용된 진행표 (A4 PDF)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#F5F2EC] rounded-xl cursor-pointer hover:bg-[#E8481C]/10 transition-colors">
                <input type="checkbox" checked={includeMasterPdf} onChange={e => setIncludeMasterPdf(e.target.checked)} className="accent-[#121110] w-4 h-4" />
                <Printer size={16} className="text-t-muted" />
                <div>
                  <p className="text-sm font-bold text-[#121110]">마스터 악보 PDF</p>
                  <p className="text-[13px] text-t-muted">셋리스트 순서대로 병합된 악보</p>
                </div>
              </label>

              {schedules.length > 0 && (
                <div>
                  <label className="flex items-center gap-3 p-3 bg-[#F5F2EC] rounded-xl cursor-pointer hover:bg-[#E8481C]/10 transition-colors">
                    <input type="checkbox" checked={includeSchedule} onChange={e => setIncludeSchedule(e.target.checked)} className="accent-[#121110] w-4 h-4" />
                    <Calendar size={16} className="text-t-muted" />
                    <div>
                      <p className="text-sm font-bold text-[#121110]">일정 타임라인</p>
                      <p className="text-[13px] text-t-muted">시간, 구분, 장소, 메모 등 세부 일정 포함</p>
                    </div>
                  </label>
                  {includeSchedule && (
                    <div className="mt-2 ml-7 bg-white border border-black/5 rounded-lg p-3 max-h-28 overflow-y-auto space-y-1.5">
                      {schedules.map((s, i) => (
                        <div key={i} className="text-[13px] flex gap-2">
                          <span className="font-bold text-t-copper shrink-0">{s.date ? `${s.date.slice(5)} ` : ''}{s.time}</span>
                          <span className="text-[#121110] font-bold">{s.title}</span>
                          {s.location && <span className="text-t-muted">📍{s.location}</span>}
                          {s.memo && <span className="text-[#9CA3AF] italic">({s.memo})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 shrink-0">
          <button
            onClick={handleSend}
            disabled={sending || !emailTo.trim() || items.length === 0}
            className="w-full py-3 bg-[#121110] text-white rounded-xl font-bold hover:bg-[#2A2826] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {sending ? '전송 중...' : '이메일 전송'}
          </button>
        </div>
      </div>
    </div>
  );
}
