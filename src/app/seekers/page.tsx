"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, BookOpen, Headphones, Video } from 'lucide-react';

const QA_DATA = [
  {
    id: 'existence-1',
    category: 'existence',
    keywords: '하나님 존재 증거 god evidence',
    question: '하나님이 존재한다는 증거가 있나요?',
    questionEn: 'Is there evidence for God?',
    shortAnswer: (
      <>
        "증거는 있다. 단, 수학 공식처럼 '증명'되는 건 아니다.<br />하지만 존재하지 않는다는 증거도 없다."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">하나님의 존재는 실험실에서 증명되는 종류의 주제가 아니에요. 하지만 그렇다고 근거가 없는 건 아니에요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">우주의 시작이 있었다</strong>는 건 현대 과학이 동의하는 사실이에요 (빅뱅). 시작이 있다면 시작케 한 무언가가 있어야 해요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">우주의 정밀함</strong>도 있어요. 물리 상수 하나만 조금 달라져도 생명은 불가능했을 거예요. 우연치고는 너무 정교해요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">인간 내면의 도덕 감각</strong>도요. 문화가 달라도 "살인은 나쁘다"는 감각은 보편적이에요. 이 감각은 어디서 왔을까요?</p>
        <p className="mb-4">하나님의 존재는 믿음의 도약이 필요해요. 하지만 눈 감고 뛰는 것이 아니라, 증거들을 보고 나서 한 발을 내딛는 것에 가까워요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] group mb-4">
          <div className="relative aspect-video bg-[white] flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1810 0%, #FAF9F6 100%)' }}>
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
              <div className="font-serif text-[0.9rem] text-[#C48C5E] tracking-[0.1em]">ONE QUESTION</div>
              <div className="font-serif text-[1.3rem] text-[#2D2926] italic">"Is there a God?"</div>
            </div>
            <div className="absolute w-12 h-12 rounded-full bg-[rgba(250,249,246,0.9)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 z-20">
              <Play className="w-4 h-4 fill-[#FAF9F6] text-[#FAF9F6] ml-1" />
            </div>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">One Question ep.01</span>
            <span className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98] tracking-[0.05em]">3:24</span>
          </div>
        </div>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-colors duration-200 hover:border-[#C48C5E]">
          <div className="w-10 h-10 rounded bg-[white] border border-[rgba(45,41,38,0.1)] flex items-center justify-center shrink-0">
            <Headphones className="w-4 h-4 text-[#C48C5E]" />
          </div>
          <div className="flex-1">
            <div className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">Before the Beginning</div>
            <div className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98]">ibigband — 관련 수록곡</div>
          </div>
          <Play className="w-4 h-4 text-[#C48C5E]" />
        </div>
        <div className="mt-4 border-t border-[rgba(45,41,38,0.1)] pt-4">
          <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
          <a href="#" className="flex items-center gap-3 py-2 border-b border-[rgba(45,41,38,0.1)] hover:text-[#C48C5E] transition-colors group">
            <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
              <BookOpen className="w-3 h-3" />
            </div>
            <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">Mere Christianity — C.S. 루이스</span>
            <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Book</span>
          </a>
          <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
            <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
              <Video className="w-3 h-3" />
            </div>
            <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">Does God Exist? — BibleProject</span>
            <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Video</span>
          </a>
        </div>
      </>
    )
  },
  {
    id: 'history-1',
    category: 'history',
    keywords: '예수 실존 존재 jesus existed history',
    question: '예수는 실제로 존재했나요?',
    questionEn: 'Did Jesus really exist?',
    shortAnswer: (
      <>
        "예스. 이건 기독교인만의 주장이 아니에요.<br />역사학계의 주류 견해예요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">예수의 역사적 실존은 신학이 아니라 역사학의 영역이에요. 역사학자들은 — 기독교인이든 아니든 — 대부분 예수가 실존했다는 데 동의해요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">로마 역사가 타키투스</strong>는 서기 116년에 예수의 처형을 기록했어요. <strong className="text-[#2D2926] font-normal">유대 역사가 요세푸스</strong>도 예수를 언급했어요. 이들은 복음을 전하려고 글을 쓴 사람들이 아니에요.</p>
        <p className="mb-4">더 어려운 질문은 "예수가 누구였는가"예요. 역사는 그가 존재했다고 말해요. 그가 누구였는지는 우리 각자가 대면해야 할 질문이에요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] group mb-4">
          <div className="relative aspect-video bg-[#F2EFE9] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
              <div className="font-serif text-[0.9rem] text-[#C48C5E] tracking-[0.1em]">ONE QUESTION</div>
              <div className="font-serif text-[1.3rem] text-[#2D2926] italic">"Did Jesus exist?"</div>
            </div>
            <div className="absolute w-12 h-12 rounded-full bg-[rgba(250,249,246,0.9)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 z-20">
               <Play className="w-4 h-4 fill-[#C48C5E] text-[#C48C5E] ml-1" />
            </div>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">One Question ep.02</span>
            <span className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98] tracking-[0.05em]">2:58</span>
          </div>
        </div>
        <div className="mt-4 border-t border-[rgba(45,41,38,0.1)] pt-4">
          <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
          <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
            <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
              <BookOpen className="w-3 h-3" />
            </div>
            <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">The Case for Christ — 리 스트로벨</span>
            <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Book</span>
          </a>
        </div>
      </>
    )
  },
  {
    id: 'history-2',
    category: 'history',
    keywords: '성경 신뢰 믿을 reliable bible',
    question: '성경은 믿을 수 있나요?',
    questionEn: 'Is the Bible reliable?',
    shortAnswer: (
      <>
        "완벽하게 이해되지 않을 수 있지만,<br />무시할 수 없는 문서예요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">역사적 신뢰성:</strong> 고고학은 반복적으로 성경의 기록을 확인해 왔어요. 한때 의심받던 지명, 인물, 사건들이 발굴을 통해 실재했음이 확인됐어요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">문헌적 신뢰성:</strong> 신약성경은 고대 문서 중 가장 많은 사본이 가장 이른 시기에 작성된 문서예요. 그리스 고전들보다 훨씬 풍부한 근거가 있어요.</p>
        <p className="mb-4">성경에 어려운 부분들이 있는 건 사실이에요. 하지만 <strong className="text-[#2D2926] font-normal">어렵다는 것과 거짓이라는 건 다른 얘기</strong>예요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] mb-4">
          <div className="w-10 h-10 rounded bg-[white] border border-[rgba(45,41,38,0.1)] flex items-center justify-center shrink-0">
             <Headphones className="w-4 h-4 text-[#C48C5E]" />
          </div>
          <div className="flex-1">
            <div className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">Ancient Words</div>
            <div className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98]">ibigband — 관련 수록곡</div>
          </div>
          <Play className="w-4 h-4 text-[#C48C5E]" />
        </div>
        <div className="mt-4 border-t border-[rgba(45,41,38,0.1)] pt-4">
          <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
          <a href="#" className="flex items-center gap-3 py-2 border-b border-[rgba(45,41,38,0.1)] hover:text-[#C48C5E] transition-colors group">
            <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
              <Video className="w-3 h-3" />
            </div>
            <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">The Story of the Bible — BibleProject</span>
            <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Video</span>
          </a>
          <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
            <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
              <Headphones className="w-3 h-3" />
            </div>
            <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">Alpha Podcast — 성경의 신뢰성</span>
            <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Podcast</span>
          </a>
        </div>
      </>
    )
  },
  {
    id: 'science-1',
    category: 'science',
    keywords: '과학 신앙 충돌 진화 science faith evolution',
    question: '과학과 신앙은 충돌하나요?',
    questionEn: 'Science and Faith — are they enemies?',
    shortAnswer: (
      <>
        "둘은 적이 아니에요.<br />다른 질문에 답하고 있어요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">과학은 <strong className="text-[#2D2926] font-normal">어떻게(How)</strong>에 답해요. 신앙은 <strong className="text-[#2D2926] font-normal">왜(Why)</strong>에 답해요.</p>
        <p className="mb-4">"빅뱅이 어떻게 일어났는가"는 과학의 영역이에요. "왜 아무것도 없는 것 대신 무언가가 있는가"는 과학이 대답할 수 없는 질문이에요.</p>
        <p className="mb-4">빅뱅 이론을 처음 제창한 사람은 조르주 르메트르 — 가톨릭 사제였어요. 갈릴레오, 뉴턴, 파스칼, 멘델 모두 신앙인이었어요.</p>
        <p className="mb-4">갈등처럼 보이는 것들은 대부분 <strong className="text-[#2D2926] font-normal">특정 해석들 간의 갈등</strong>이에요. 과학 자체와 신앙 자체의 갈등이 아니에요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] group">
          <div className="relative aspect-video bg-[#F2EFE9] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
              <div className="font-serif text-[0.9rem] text-[#C48C5E] tracking-[0.1em]">ONE QUESTION</div>
              <div className="font-serif text-[1.2rem] text-[#2D2926] italic">"Science vs. Faith?"</div>
            </div>
            <div className="absolute w-12 h-12 rounded-full bg-[rgba(250,249,246,0.9)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 z-20">
               <Play className="w-4 h-4 fill-[#C48C5E] text-[#C48C5E] ml-1" />
            </div>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">One Question ep.04</span>
            <span className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98] tracking-[0.05em]">4:12</span>
          </div>
        </div>
      </>
    )
  },
  {
    id: 'pain-1',
    category: 'pain',
    keywords: '고통 하나님 왜 suffering pain evil',
    question: '하나님이 있다면 왜 고통이 있나요?',
    questionEn: 'Why is there suffering?',
    shortAnswer: (
      <>
        "이건 가장 정직하고 가장 무거운 질문이에요.<br />쉬운 답은 없어요. 하지만 기독교는 이 질문 앞에서 도망치지 않아요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">이 질문은 머리의 질문이기 전에 <strong className="text-[#2D2926] font-normal">가슴의 질문</strong>이에요. 그 무게를 먼저 인정해야 해요.</p>
        <p className="mb-4">기독교의 답은 이렇게 시작해요: <strong className="text-[#2D2926] font-normal">하나님도 고통당했어요.</strong> 예수는 십자가에서 "왜 나를 버리셨나이까"라고 외쳤어요. 이 고통은 연기가 아니에요.</p>
        <p className="mb-4"><strong className="text-[#2D2926] font-normal">자유의 대가:</strong> 사랑은 강요될 수 없어요. 자유가 있다면 그것을 잘못 쓸 가능성도 있고, 그것이 고통을 만들어요.</p>
        <p className="mb-4">기독교는 고통을 없애준다고 약속하지 않아요. 고통 속에서도 <strong className="text-[#2D2926] font-normal">혼자가 아니라고</strong> 말해요. 그리고 이 이야기가 고통으로 끝나지 않는다고 말해요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">관련 미디어</p>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg overflow-hidden cursor-pointer transition-colors duration-200 hover:border-[#C48C5E] group mb-4">
          <div className="relative aspect-video bg-[#F2EFE9] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 z-10">
              <div className="font-serif text-[0.9rem] text-[#C48C5E] tracking-[0.1em]">ONE QUESTION</div>
              <div className="font-serif text-[1.2rem] text-[#2D2926] italic">"Why suffering?"</div>
            </div>
            <div className="absolute w-12 h-12 rounded-full bg-[rgba(250,249,246,0.9)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 z-20">
               <Play className="w-4 h-4 fill-[#C48C5E] text-[#C48C5E] ml-1" />
            </div>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">One Question ep.05</span>
            <span className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98] tracking-[0.05em]">3:47</span>
          </div>
        </div>
        <div className="bg-[#F2EFE9] border border-[rgba(45,41,38,0.1)] rounded-lg p-4 flex items-center gap-3 cursor-pointer transition-colors duration-200 hover:border-[#C48C5E]">
          <div className="w-10 h-10 rounded bg-[white] border border-[rgba(45,41,38,0.1)] flex items-center justify-center shrink-0">
             <Headphones className="w-4 h-4 text-[#C48C5E]" />
          </div>
          <div className="flex-1">
            <div className="text-[1rem] md:text-[1.05rem] text-[#2D2926]">Even Then</div>
            <div className="text-[1rem] md:text-[1.05rem] md:text-[0.85rem] text-[#A19D98]">ibigband — 관련 수록곡</div>
          </div>
          <Play className="w-4 h-4 text-[#C48C5E]" />
        </div>
      </>
    )
  },
  {
    id: 'church-1',
    category: 'church',
    keywords: '교회 위선자 hypocrite church',
    question: '교회는 왜 위선자들로 가득한가요?',
    questionEn: 'Why is the church full of hypocrites?',
    shortAnswer: (
      <>
        "맞아요. 그래서 교회가 필요한 거예요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">기독교는 완벽한 사람들의 모임이 아니에요. 자신이 부족하고 용서가 필요하다는 걸 인정한 사람들의 모임이에요. 위선자가 있다는 건 사실이에요 — 저 포함해서요.</p>
        <p className="mb-4">예수 자신도 그 시대의 종교 지도자들, 즉 가장 위선적인 사람들을 <strong className="text-[#2D2926] font-normal">가장 강하게 비판했어요.</strong> 그는 종교적 겉치레를 싫어했어요.</p>
        <p className="mb-4">교회의 실패 때문에 예수를 거부하는 건, 나쁜 의사 때문에 의학 자체를 거부하는 것과 비슷해요. <strong className="text-[#2D2926] font-normal">예수는 교회가 아니에요.</strong> 그를 직접 만나보는 게 먼저예요.</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
        <a href="#" className="flex items-center gap-3 py-2 border-b border-[rgba(45,41,38,0.1)] hover:text-[#C48C5E] transition-colors group">
          <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
            <BookOpen className="w-3 h-3" />
          </div>
          <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">The Reason for God — Tim Keller</span>
          <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Book</span>
        </a>
        <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
          <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
            <Video className="w-3 h-3" />
          </div>
          <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">Why I Left the Church — Alpha</span>
          <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Video</span>
        </a>
      </>
    )
  },
  {
    id: 'church-2',
    category: 'church',
    keywords: '모든 종교 같다 all religions same',
    question: '모든 종교는 결국 같은 거 아닌가요?',
    questionEn: "Aren't all religions the same?",
    shortAnswer: (
      <>
        "표면은 비슷해 보여도, 핵심에서 서로 충돌해요.<br />그 차이를 무시하는 건 오히려 각 종교를 존중하지 않는 거예요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">"모든 종교는 사랑과 선을 가르친다"는 건 맞는 말이에요. 하지만 핵심 질문들에서 종교들은 매우 다른 답을 내놓아요.</p>
        <p className="mb-4">하나님이 인격적인 존재인가? 구원은 스스로 얻는 것인가, 받는 것인가? 예수는 구원자인가, 선생인가?</p>
        <p className="mb-4">이 질문들에 불교, 이슬람, 힌두교, 기독교는 서로 다른 답을 내놓아요. 모두 맞을 수는 없어요. 그래서 <strong className="text-[#2D2926] font-normal">어느 쪽이 진실에 가까운지 탐구하는 게 의미 있어요.</strong></p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
        <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
          <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
            <BookOpen className="w-3 h-3" />
          </div>
          <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">The Intolerance of Tolerance — D.A. Carson</span>
          <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Book</span>
        </a>
      </>
    )
  },
  {
    id: 'personal-1',
    category: 'personal',
    keywords: '기도 효과 prayer work',
    question: '기도가 실제로 효과가 있나요?',
    questionEn: 'Does prayer actually work?',
    shortAnswer: (
      <>
        "기도는 자판기가 아니에요.<br />하지만 단순한 위약 효과도 아니에요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">기도를 원하는 걸 얻는 수단으로 보면 실망할 수밖에 없어요. 기도는 <strong className="text-[#2D2926] font-normal">인격적인 하나님과의 대화</strong>예요.</p>
        <p className="mb-4">부모에게 하는 부탁과 비슷해요. 좋은 부모는 아이가 원하는 걸 다 들어주지 않아요. 하지만 관계는 깊어져요. 부탁 자체가 관계를 만들어요.</p>
        <p className="mb-4">시도해보지 않고 결론 내리는 건 조금 이른 거 아닐까요?</p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">직접 해보기</p>
        <div className="bg-[#F2EFE9] border border-[rgba(196,140,94,0.2)] rounded-lg p-5">
          <p className="font-serif text-[1rem] italic text-[#C48C5E] mb-3 leading-[1.5]">"기도가 뭔지 모르지만<br />부탁하고 싶은 게 있어요"</p>
          <p className="text-[0.8rem] text-[#78716A] leading-[1.6]">아래로 내려가서 이야기를 나눠보세요. 판단 없이 들을게요.</p>
        </div>
      </>
    )
  },
  {
    id: 'personal-2',
    category: 'personal',
    keywords: '신앙 목발 위안 crutch weak faith',
    question: '신앙은 약한 사람들의 위안 아닌가요?',
    questionEn: "Isn't faith just a crutch?",
    shortAnswer: (
      <>
        "다리가 부러졌을 때 목발은<br />약함의 표시가 아니에요."
      </>
    ),
    fullAnswer: (
      <>
        <p className="mb-4">프로이트가 이 말을 했어요. 하지만 "위안을 준다"는 게 왜 거짓이라는 증거가 되는지는 불분명해요. 진통제가 효과적이라고 해서 병이 없다는 뜻은 아니에요.</p>
        <p className="mb-4">역사를 보면 기독교 신앙은 종종 위험하고 용기 있는 선택이었어요. 로마 제국의 박해, 노예제 폐지 운동, 나치 독일에서의 저항 — 이건 위안을 찾는 사람들의 모습이 아니에요.</p>
        <p className="mb-4">C.S. 루이스는 무신론자였다가 기독교인이 됐어요. 그는 이렇게 말했어요: <strong className="text-[#2D2926] font-normal">"나는 하나님을 믿고 싶지 않았어요. 그렇게 되면 삶이 훨씬 불편해지니까요."</strong></p>
      </>
    ),
    media: (
      <>
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.15em] text-[#A19D98] uppercase mb-2">더 읽어보기</p>
        <a href="#" className="flex items-center gap-3 py-2 hover:text-[#C48C5E] transition-colors group">
          <div className="w-7 h-7 rounded bg-[white] flex items-center justify-center shrink-0 text-[#78716A] group-hover:text-[#C48C5E]">
            <BookOpen className="w-3 h-3" />
          </div>
          <span className="text-[1rem] md:text-[1.05rem] text-[#78716A] group-hover:text-[#C48C5E]">Surprised by Joy — C.S. 루이스</span>
          <span className="text-[1rem] md:text-[1.05rem] text-[#A19D98] ml-auto tracking-[0.05em]">Book</span>
        </a>
      </>
    )
  }
];

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'existence', label: '존재와 우주' },
  { id: 'history', label: '역사와 문서' },
  { id: 'science', label: '과학과 신앙' },
  { id: 'pain', label: '고통과 공의' },
  { id: 'church', label: '교회와 종교' },
  { id: 'personal', label: '개인과 신앙' }
];

export default function SeekersPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 0) {
      setActiveFilter('all');
    }
  };

  const filteredData = useMemo(() => {
    let data = QA_DATA;
    if (activeFilter !== 'all') {
      data = data.filter(item => item.category === activeFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      data = data.filter(item => {
        const kw = (item.keywords || '') + item.question;
        return kw.toLowerCase().includes(q);
      });
    }
    return data;
  }, [activeFilter, searchQuery]);

  const categoriesWithItems = useMemo(() => {
    const cats = new Set(filteredData.map(item => item.category));
    return cats;
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2D2926] font-sans antialiased text-[15px] leading-[1.7] font-light selection:bg-[#C48C5E] selection:text-[#FAF9F6]">
       <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s ease forwards; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }
      `}} />

      {/* Hero */}
      <section className="pt-[7rem] md:pt-[9rem] px-5 md:px-10 pb-[3rem] md:pb-[5rem] max-w-[900px] mx-auto text-center">
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.25em] text-[#C48C5E] uppercase mb-8 animate-fade-up delay-200">
          Seekers / 구도자
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] font-light leading-[1.05] tracking-[-0.02em] text-[#2D2926] mb-8 animate-fade-up delay-400">
          Questions<br />worth <em className="italic text-[#C48C5E]">asking.</em>
        </h1>
        <p className="text-[1.05rem] text-[#78716A] max-w-[540px] mx-auto mb-12 animate-fade-up delay-600">
          믿음이 없어도 괜찮아요. 질문이 있다면, 여기서 시작하세요.
        </p>
        <div className="w-[1px] h-[60px] bg-gradient-to-b from-[#C48C5E] to-transparent mx-auto animate-fade-up delay-800"></div>
      </section>

      {/* Opening Quote */}
      <div className="max-w-[700px] mx-auto px-5 md:px-10 pt-6 pb-[3rem] md:pb-[4rem] text-center">
        <blockquote className="font-handwriting text-[clamp(1.6rem,4vw,2.5rem)] leading-[1.4] text-[#2D2926] relative p-0 m-0">
          <span className="absolute top-6 md:top-10 -left-2 md:-left-6 text-[6rem] md:text-[8rem] leading-none text-[#C48C5E] opacity-20 font-serif">"</span>
          우리는 노래를 만드는 사람들입니다.<br />
          음악이 닿지 못하는 곳에 있는 무언가를<br />찾고 있기 때문에.
          <cite className="block mt-6 text-[0.95rem] md:text-[1rem] tracking-[0.15em] text-[#C48C5E] not-italic uppercase">
            — ibigband
          </cite>
        </blockquote>
      </div>

      {/* Search */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-6 md:pb-8">
        <input 
          type="text" 
          placeholder="궁금한 것을 검색하세요  /  Search your question..." 
          value={searchQuery}
          onChange={handleSearch}
          className="w-full bg-white shadow-sm border border-[#2D2926]/10 rounded-[20px] md:rounded-full px-6 py-4 md:py-4 text-[#2D2926] font-sans text-[0.95rem] md:text-[1rem] outline-none transition-all duration-300 focus:border-[#C48C5E] focus:shadow-md placeholder:text-[#A19D98]"
        />
      </div>

      {/* Filter Pills */}
      <div className="max-w-[1100px] mx-auto px-5 md:px-10 pb-[2rem] md:pb-[3rem]">
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.2em] text-[#A19D98] uppercase mb-5">주제별로 보기</p>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-[0.95rem] md:text-[1.05rem] font-bold transition-all duration-300 cursor-pointer shadow-sm
                ${activeFilter === cat.id 
                  ? 'bg-[#2D2926] text-white border-transparent transform -translate-y-[1px] shadow-md' 
                  : 'bg-white border-[1.5px] border-[#2D2926]/20 text-[#4a4845] hover:bg-[#F2EFE9] hover:border-[#2D2926]/40 hover:text-[#2D2926] font-semibold'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="text-[0.95rem] md:text-[1rem] text-[#78716A] text-center mt-6">질문(?)을 터치하시면 답글(!)을 보실 수 있습니다.</p>
      </div>

      {/* Q&A List */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-10 pb-[4rem] md:pb-[6rem]">
        {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
          if (!categoriesWithItems.has(cat.id)) return null;

          const catItems = filteredData.filter(item => item.category === cat.id);

          return (
            <div key={cat.id} className="mb-8">
              <div className="flex items-center gap-4 mt-14 mb-6 after:content-[''] after:flex-1 after:h-[1px] after:bg-[rgba(45,41,38,0.1)]">
                <span className="text-[1rem] md:text-[1.05rem] tracking-[0.2em] text-[#C48C5E] uppercase">{cat.label}</span>
              </div>

              {catItems.map(item => {
                const isOpen = !!openItems[item.id];
                return (
                  <div key={item.id} className="mb-3 md:mb-4 bg-white rounded-2xl md:rounded-[24px] border border-[#2D2926]/10 overflow-hidden group/item shadow-sm hover:shadow-md transition-all duration-300">
                    <button 
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left font-sans transition-colors duration-200 outline-none hover:bg-slate-50/50"
                    >
                      <div className="pr-4">
                        <div className={`font-bold text-[1.2rem] md:text-[1.3rem] leading-[1.3] transition-colors duration-300 ${isOpen ? 'text-[#C48C5E]' : 'text-[#2D2926] group-hover/item:text-[#C48C5E]'}`}>
                          {item.question}
                        </div>
                        <div className="text-[1rem] md:text-[1.05rem] tracking-[0.05em] text-[#78716A] font-medium mt-1.5 font-sans">
                          {item.questionEn}
                        </div>
                      </div>
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-[#C48C5E]/10 text-[#C48C5E]' : 'bg-[#2D2926]/5 text-[#78716A]'}`}>
                        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                        </div>
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-5 md:px-6 pb-6 md:pb-8 pt-2 md:pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
                        <div>
                          <div className="font-handwriting text-[1.4rem] md:text-[1.6rem] text-[#2D2926] leading-[1.6] py-5 px-6 border-l-2 border-[#C48C5E] bg-[rgba(196,140,94,0.05)] rounded-r-sm mb-6">
                            {item.shortAnswer}
                          </div>
                          <div className="text-[1.05rem] md:text-[1.1rem] font-medium leading-[1.85] text-[#4a4845]">
                            {item.fullAnswer}
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          {item.media}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {filteredData.length === 0 && (
          <div className="py-20 text-center text-[#78716A]">
             검색 결과가 없습니다.
          </div>
        )}
      </section>

      {/* CTA Section */}
      <div className="border-t border-[rgba(45,41,38,0.1)] py-[4rem] md:py-[6rem] px-5 md:px-10 text-center max-w-[700px] mx-auto">
        <p className="text-[1rem] md:text-[1.05rem] tracking-[0.25em] text-[#C48C5E] uppercase mb-8">Next Step</p>
        <h2 className="font-handwriting text-[clamp(2.4rem,6vw,3.5rem)] leading-[1.2] mb-5 text-[#2D2926]">
          더 이야기하고<br />싶으신가요?
        </h2>
        <p className="text-[1.05rem] text-[#78716A] mb-12">
          질문이 더 있거나, 누군가와 직접 이야기하고 싶다면 편하게 연락하세요. 판단 없이 듣겠습니다.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#" className="px-8 py-3 bg-[#B87A4B] text-white rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all shadow hover:shadow-md hover:bg-[#a66a3d]">
            이야기 나누기
          </a>
          <Link href="/music" className="px-8 py-3 bg-transparent text-[#4a4845] border-[1.5px] border-[#2D2926]/20 rounded-full font-sans text-[0.95rem] md:text-[1.05rem] font-bold tracking-[0.08em] uppercase transition-all hover:border-[#2D2926]/60 hover:text-[#2D2926] hover:bg-black/5">
            음악 듣기
          </Link>
        </div>
      </div>
    </div>
  );
}
