"use client";

import { useState } from 'react';
import { X, Sparkles, Loader2, FileText, Mic, Type, Copy, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: { type: 'transcript' | 'guide'; title: string; note: string }) => void;
  userToken?: string;
}

export default function TextEditorModal({ isOpen, onClose, onAdd, userToken }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'transcript' | 'guide'>('transcript');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAdd = () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    onAdd({ type, title: title.trim(), note: content.trim() });
    setTitle('');
    setContent('');
    setAiPrompt('');
    onClose();
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('AI에게 요청할 내용을 입력해주세요.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/seekers/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
        },
        body: JSON.stringify({
          prompt: `당신은 교회 예배/찬양 팀을 위한 전문 작성 도우미입니다.
다음 요청에 맞는 텍스트를 작성해주세요. 자연스럽고 진심이 담긴 한국어로 작성하세요.
마크다운이나 특수 형식 없이 순수 텍스트로만 작성해주세요.

요청: ${aiPrompt}

${type === 'transcript' ? '형식: 기도문/멘트/원고 형식으로 작성' : '형식: 진행 가이드/진행 멘트 형식으로 작성'}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generated = data.text || data.answer || data.content || '';
        if (generated) {
          setContent(prev => prev ? prev + '\n\n' + generated : generated);
          if (!title) setTitle(aiPrompt.slice(0, 30) + (aiPrompt.length > 30 ? '...' : ''));
        } else {
          alert('AI 응답을 파싱할 수 없습니다.');
        }
      } else {
        // Fallback: use generate-blog API with simple prompt
        const res2 = await fetch('/api/generate-blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
          },
          body: JSON.stringify({ topic: aiPrompt, keywords: type === 'transcript' ? '기도문,멘트,원고' : '진행가이드,MC멘트' }),
        });
        if (res2.ok) {
          const data2 = await res2.json();
          const text = data2.data?.content || '';
          // Strip markdown
          const plain = text.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '');
          setContent(prev => prev ? prev + '\n\n' + plain : plain);
          if (!title) setTitle(data2.data?.title || aiPrompt.slice(0, 30));
        } else {
          alert('AI 생성에 실패했습니다. 관리자 권한이 필요할 수 있습니다.');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('AI 생성 중 오류: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-black/5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Type className="text-[#E6C79C]" /> 텍스트 작성
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setType('transcript')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === 'transcript' ? 'bg-[#2D2926] text-white' : 'bg-[#FAF9F6] text-[#78716A]'}`}
            >
              <FileText size={14} /> 기도문 / 원고
            </button>
            <button
              onClick={() => setType('guide')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${type === 'guide' ? 'bg-blue-600 text-white' : 'bg-[#FAF9F6] text-[#78716A]'}`}
            >
              <Mic size={14} /> 진행 멘트 / 가이드
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목 (예: 대표기도문, MC 오프닝 멘트)"
            className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#2D2926]"
          />

          {/* AI Generation */}
          <div className="bg-gradient-to-r from-[#E6C79C]/10 to-[#FAF9F6] rounded-2xl p-4 border border-[#E6C79C]/20">
            <p className="text-xs font-bold text-[#8C6B1C] mb-2 flex items-center gap-1"><Sparkles size={12} /> AI 생성 도우미</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !aiLoading && generateWithAI()}
                placeholder="예: 부활절 감사 기도문, 헌금 안내 멘트, 새가족 환영 인사"
                className="flex-1 bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E6C79C]"
              />
              <button
                onClick={generateWithAI}
                disabled={aiLoading || !aiPrompt.trim()}
                className="px-4 py-2.5 bg-[#2D2926] text-[#E6C79C] rounded-xl text-sm font-bold hover:bg-[#78716A] transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? '생성 중...' : 'AI 생성'}
              </button>
            </div>
          </div>

          {/* Text editor */}
          <div className="relative">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 직접 입력하거나 AI로 생성하세요..."
              rows={12}
              className="w-full bg-[#FAF9F6] border border-black/10 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-[#2D2926] resize-none"
            />
            {content && (
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-white border border-black/10 rounded-lg hover:bg-black/5 transition-colors"
                title="복사"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-[#78716A]" />}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-[#78716A] font-bold text-sm hover:text-[#2D2926]">취소</button>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="px-6 py-2.5 bg-[#2D2926] text-white rounded-xl font-bold text-sm hover:bg-[#78716A] transition-colors disabled:opacity-30"
          >
            라이브러리에 추가
          </button>
        </div>
      </div>
    </div>
  );
}
