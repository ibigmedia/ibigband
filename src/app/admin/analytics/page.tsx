"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LineChart, BarChart, Users, Settings, Search, HelpCircle, Activity } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-handwriting text-[#E6C79C]">Analytics & SEO Dashboard</h1>
          <p className="text-gray-400 mt-2">구글 애널리틱스, 서치콘솔 및 AI 마케팅 데이터 분석</p>
        </div>
        <Button variant="secondary" className="flex items-center gap-2">
          <Settings size={16} /> 설정 연동
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 flex flex-col justify-between items-start text-white">
           <div>
             <div className="flex items-center gap-2 text-[#E6C79C] mb-4">
                <Users size={24} />
                <h3 className="font-bold">일일 방문자 수</h3>
             </div>
             <p className="text-4xl font-bold font-handwriting">1,204</p>
             <p className="text-sm text-green-400 mt-2">↑ 12% from last week</p>
           </div>
        </Card>
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 flex flex-col justify-between items-start text-white">
           <div>
             <div className="flex items-center gap-2 text-[#E6C79C] mb-4">
                <Search size={24} />
                <h3 className="font-bold">최적화 검색 노출 (AEO/SEO)</h3>
             </div>
             <p className="text-4xl font-bold font-handwriting">8,401</p>
             <p className="text-sm text-green-400 mt-2">↑ 5% from last week</p>
           </div>
        </Card>
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 flex flex-col justify-between items-start text-white">
           <div>
             <div className="flex items-center gap-2 text-[#E6C79C] mb-4">
                <Activity size={24} />
                <h3 className="font-bold">블로그 클릭 전환율</h3>
             </div>
             <p className="text-4xl font-bold font-handwriting">4.2%</p>
             <p className="text-sm text-red-400 mt-2">↓ 0.5% from last week</p>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#78716A]/10 pb-4">
            <h3 className="text-xl font-bold text-white flex gap-2 items-center"><LineChart className="text-[#E6C79C]" /> 웹사이트 트래픽 (GA4)</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-black/20 rounded-ibig border border-[#78716A]/10">
            {/* Placeholder for Interactive Chart */}
            <p className="text-[#78716A] text-sm">GA4 데이터 시각화 차트가 렌더링될 영역입니다.</p>
          </div>
        </Card>

        <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6">
          <div className="flex items-center justify-between mb-6 border-b border-[#78716A]/10 pb-4">
            <h3 className="text-xl font-bold text-white flex gap-2 items-center"><BarChart className="text-[#E6C79C]" /> 마케팅 컨버전 & 스마트 태그</h3>
          </div>
          <div className="h-64 flex items-center justify-center bg-black/20 rounded-ibig border border-[#78716A]/10">
            {/* Placeholder for Interactive Chart */}
            <p className="text-[#78716A] text-sm">구글 태그 매니저 연동 이벤트 트리거 실시간 현황이 표시됩니다.</p>
          </div>
        </Card>
      </div>

      <Card className="bg-[#2D2926]/50 border border-[#78716A]/20 p-6 mt-8">
         <h3 className="text-xl font-bold text-[#E6C79C] mb-4 flex gap-2 items-center"><HelpCircle size={20} /> AI 마케팅 인사이트</h3>
         <div className="p-4 bg-black/20 rounded-ibig space-y-4">
            <p className="text-sm text-white font-light leading-relaxed">
               • <strong>AEO(AI 검색엔진) 최적화 제안:</strong> 최신 트렌드를 분석한 결과 <strong>'소규모 찬양팀 합주 팁'</strong>과 관련된 키워드 트래픽이 상승하고 있습니다. 관련 블로그를 작성해 보세요.<br /><br />
               • <strong>페이지 성능 관리:</strong> 웹페이지 이미지 캐싱 최적화로 인해 로딩 속도가 20% 개선되었습니다. 방문자의 평균 체류시간이 높아졌습니다.
            </p>
         </div>
      </Card>
    </div>
  );
}
