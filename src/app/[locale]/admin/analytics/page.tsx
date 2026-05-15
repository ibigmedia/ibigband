"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  LineChart, BarChart, Users, Settings, Search, HelpCircle, Activity,
  CheckCircle, ExternalLink, X, Copy, Globe, TrendingUp, Clock, Eye
} from 'lucide-react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export default function AnalyticsDashboardPage() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);

  useEffect(() => {
    // gtag가 로드되었는지 확인
    setGaConnected(!!GA_ID && typeof window !== 'undefined' && !!(window as any).gtag);
  }, []);

  const copyGaId = () => {
    navigator.clipboard.writeText(GA_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">Analytics & SEO Dashboard</h1>
          <p className="text-gray-400 mt-2">구글 애널리틱스, 서치콘솔 및 AI 마케팅 데이터 분석</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2" onClick={() => setShowSettingsModal(true)}>
          <Settings size={16} /> 설정 연동
        </Button>
      </div>

      {/* 연동 상태 배너 */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
        gaConnected
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      }`}>
        {gaConnected ? <CheckCircle size={18} /> : <Clock size={18} />}
        <span className="text-sm font-medium">
          {gaConnected
            ? `Google Analytics 연동 완료 (${GA_ID}) — 데이터 수집 중`
            : 'Google Analytics 연동 대기 — 배포 후 데이터 수집이 시작됩니다'}
        </span>
        {GA_ID && (
          <a href={`https://analytics.google.com/analytics/web/#/p${GA_ID.replace('G-', '')}/reports/intelligenthome`}
            target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs flex items-center gap-1 hover:underline opacity-70 hover:opacity-100">
            GA4 콘솔 <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users size={24} />}
          title="실시간 사용자"
          description="GA4 연동 후 실시간 데이터가 표시됩니다"
          connected={gaConnected}
        />
        <StatCard
          icon={<Eye size={24} />}
          title="페이지뷰"
          description="GA4 연동 후 페이지뷰 데이터가 표시됩니다"
          connected={gaConnected}
        />
        <StatCard
          icon={<Activity size={24} />}
          title="평균 세션 시간"
          description="GA4 연동 후 세션 데이터가 표시됩니다"
          connected={gaConnected}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#78716A]/10 pb-4">
            <h3 className="text-xl font-bold text-white flex gap-2 items-center">
              <LineChart className="text-[#E6C79C]" /> 웹사이트 트래픽 (GA4)
            </h3>
          </div>
          <div className="h-64 flex flex-col items-center justify-center bg-black/20 rounded-ibig border border-[#78716A]/10">
            {gaConnected ? (
              <>
                <TrendingUp size={32} className="text-[#E6C79C]/30 mb-3" />
                <p className="text-white/50 text-sm font-medium">데이터 수집 중...</p>
                <p className="text-[#78716A] text-xs mt-1">GA4 콘솔에서 상세 리포트를 확인하세요</p>
                <a href={`https://analytics.google.com/analytics/web/#/p${GA_ID.replace('G-', '')}/reports/intelligenthome`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 text-xs text-[#E6C79C] flex items-center gap-1 hover:underline">
                  GA4 리포트 열기 <ExternalLink size={12} />
                </a>
              </>
            ) : (
              <p className="text-[#78716A] text-sm">"설정 연동"을 완료하면 GA4 데이터가 수집됩니다.</p>
            )}
          </div>
        </Card>

        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#78716A]/10 pb-4">
            <h3 className="text-xl font-bold text-white flex gap-2 items-center">
              <BarChart className="text-[#E6C79C]" /> 인기 페이지 TOP 5
            </h3>
          </div>
          <div className="h-64 flex flex-col items-center justify-center bg-black/20 rounded-ibig border border-[#78716A]/10">
            {gaConnected ? (
              <>
                <Globe size={32} className="text-[#E6C79C]/30 mb-3" />
                <p className="text-white/50 text-sm font-medium">페이지 데이터 수집 중...</p>
                <p className="text-[#78716A] text-xs mt-1">방문 데이터가 충분히 쌓이면 표시됩니다</p>
              </>
            ) : (
              <p className="text-[#78716A] text-sm">GA4 연동 후 인기 페이지가 표시됩니다.</p>
            )}
          </div>
        </Card>
      </div>

      {/* 추적 이벤트 안내 */}
      <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 mt-8">
        <h3 className="text-xl font-bold text-[#E6C79C] mb-4 flex gap-2 items-center">
          <HelpCircle size={20} /> GA4 자동 추적 항목
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: '페이지뷰', desc: '모든 페이지 방문 자동 추적', active: gaConnected },
            { label: '스크롤', desc: '페이지 90% 이상 스크롤 시 기록', active: gaConnected },
            { label: '외부 링크 클릭', desc: '외부 사이트로의 클릭 추적', active: gaConnected },
            { label: '사이트 검색', desc: '사이트 내 검색어 추적', active: gaConnected },
            { label: '세션 시간', desc: '사용자별 체류 시간 측정', active: gaConnected },
            { label: '파일 다운로드', desc: 'PDF, 음원 등 파일 다운로드 추적', active: gaConnected },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl">
              <div className={`w-2 h-2 rounded-full shrink-0 ${item.active ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div>
                <p className="text-sm font-bold text-white">{item.label}</p>
                <p className="text-xs text-[#78716A]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 설정 연동 모달 */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-[#2D2926] border border-[#78716A]/20 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#78716A]/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-[#E6C79C]" /> Google Analytics 설정
              </h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 연동 상태 */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${
                GA_ID ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <CheckCircle size={20} className={GA_ID ? 'text-green-400' : 'text-red-400'} />
                <div>
                  <p className={`font-bold text-sm ${GA_ID ? 'text-green-400' : 'text-red-400'}`}>
                    {GA_ID ? '연동 완료' : '미연동'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {GA_ID ? '데이터가 수집되고 있습니다' : 'Measurement ID가 설정되지 않았습니다'}
                  </p>
                </div>
              </div>

              {/* Measurement ID */}
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">Measurement ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/30 border border-[#78716A]/20 rounded-xl px-4 py-3 text-white font-mono text-sm">
                    {GA_ID || '미설정'}
                  </div>
                  {GA_ID && (
                    <button onClick={copyGaId}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-gray-300 transition-colors">
                      {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#78716A] mt-2">
                  환경변수 <code className="text-[#E6C79C]">NEXT_PUBLIC_GA_MEASUREMENT_ID</code>로 설정됨
                </p>
              </div>

              {/* gtag 스크립트 상태 */}
              <div>
                <label className="text-sm font-bold text-gray-300 block mb-2">추적 스크립트</label>
                <div className="bg-black/30 border border-[#78716A]/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${GA_ID ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-sm text-gray-300">gtag.js</span>
                    <span className={`text-xs ml-auto ${GA_ID ? 'text-green-400' : 'text-gray-500'}`}>
                      {GA_ID ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${GA_ID ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-sm text-gray-300">자동 페이지뷰 추적</span>
                    <span className={`text-xs ml-auto ${GA_ID ? 'text-green-400' : 'text-gray-500'}`}>
                      {GA_ID ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${GA_ID ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-sm text-gray-300">향상된 측정 (스크롤, 클릭 등)</span>
                    <span className={`text-xs ml-auto ${GA_ID ? 'text-green-400' : 'text-gray-500'}`}>
                      {GA_ID ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 바로가기 링크 */}
              <div className="flex gap-3">
                <a href={`https://analytics.google.com/analytics/web/#/p${GA_ID.replace('G-', '')}/reports/intelligenthome`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#E6C79C] text-[#2D2926] font-bold text-sm rounded-xl hover:bg-[#D4A373] transition-colors">
                  <ExternalLink size={14} /> GA4 대시보드 열기
                </a>
                <a href="https://tagmanager.google.com/"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition-colors">
                  <Settings size={14} /> GTM
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ icon, title, description, connected }: {
  icon: React.ReactNode; title: string; description: string; connected: boolean;
}) {
  return (
    <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 flex flex-col justify-between items-start text-white">
      <div>
        <div className="flex items-center gap-2 text-[#E6C79C] mb-4">
          {icon}
          <h3 className="font-bold">{title}</h3>
        </div>
        {connected ? (
          <>
            <p className="text-4xl font-bold font-handwriting text-white/30">—</p>
            <p className="text-xs text-[#78716A] mt-2">데이터 수집 중 · GA4 콘솔에서 확인</p>
          </>
        ) : (
          <>
            <p className="text-4xl font-bold font-handwriting text-white/20">—</p>
            <p className="text-xs text-[#78716A] mt-2">{description}</p>
          </>
        )}
      </div>
    </Card>
  );
}
