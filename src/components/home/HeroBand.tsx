// 히어로 일러스트: 연주자 일곱 명의 선 그림. 배경이 투명하고 화면 크기와 상관없이 선 굵기가 일정하다.
export default function HeroBand() {
  return (
    <svg
      viewBox="0 0 1210 210"
      role="img"
      aria-label="ibiGband line drawing of seven musicians"
      className="hero-band h-auto w-full text-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 기타 */}
      <g>
      <circle cx="74" cy="42" r="16"/><path d="M60 33q13-14 30-3M88 30l10-3"/><path d="M68 41h.01M80 41h.01M68 49q6 5 12 0"/>
      <path d="M72 58q-5 34-11 62"/><path d="M61 120q-24 16-29 28t-12 34M20 182h-12M61 120q17 24 24 62M85 182h13"/>
      <path d="M70 72q-16 18-3 30t21 7M70 72q24 14 44 18t32-4"/>
      <g className="stroke-t-copper"><path d="M92 86q-5-11-19-9t-17 12q-13 3-18 15t3 20q10 9 26 2t18-19q11-3 9-11z"/><circle cx="66" cy="102" r="6"/><path d="M90 84l84-24M174 60l12-7M74 96l14-5"/></g>
      <path d="M196 62v120M180 190q16-12 32 0M186 56h22"/>
      </g>
      {/* 드럼 */}
      <g>
      <circle cx="378" cy="58" r="16"/><path d="M364 46q14-16 30-1M372 57h.01M384 57h.01M372 65q6 4 12 0"/>
      <path d="M378 74q6 26 2 54M378 86q-24 8-42 2M378 86q12 12-6 22t-30 2"/>
      <g className="stroke-t-copper"><path d="M336 88l-30-30M340 110l-38-14"/>
      <circle cx="340" cy="152" r="38"/><circle cx="340" cy="152" r="9"/>
      <path d="M254 118q28-8 56 0q-28 9-56 0zM254 118v16q28 9 56 0v-16M264 138l-10 50M300 138l10 50"/>
      <path d="M226 80q22-8 44 0M248 76v112M232 190q16-10 32 0"/>
      <path d="M410 88q20-8 42 0M431 84v104M415 190q16-10 32 0M414 118q17 6 34 0"/></g>
      </g>
      {/* 보컬 */}
      <g>
      <circle cx="530" cy="46" r="16"/><path d="M518 34l-6-12M530 30V16M542 34l6-12"/><path d="M524 45h.01M536 45h.01M525 53q5 6 11 0"/>
      <path d="M530 62q-3 34-2 66M528 128q-16 26-20 56M528 128q14 26 22 56M508 184h-12M550 184h12"/>
      <path d="M530 76q18 12 40-8M530 76q-16 18-24 38"/>
      <g className="stroke-t-copper"><circle cx="578" cy="58" r="10"/><circle cx="578" cy="58" r="3.5"/><path d="M578 68v120M562 190q16-10 32 0M594 42l9-9M602 54l11-3"/></g>
      </g>
      {/* 트럼펫 */}
      <g>
      <circle cx="714" cy="50" r="16"/><path d="M702 40q2-14 16-13t14 15"/><path d="M704 50h.01M716 50h.01M704 58q5 4 10 0"/>
      <path d="M716 66q5 32 2 62M718 128q-14 26-24 56M718 128q16 26 18 56M694 184h-12M736 184h12"/>
      <path d="M716 80q-20 12-34-10M716 84q-14 14-24-8"/>
      <g className="stroke-t-copper"><path d="M698 58h-58M640 58l-18-11M640 58l-18 11M622 47v22M686 58q-4 12-18 12t-16-12M676 51v7M666 51v7"/></g>
      <path d="M630 108h44l-8 22h-30zM652 130v58M636 190q16-10 32 0"/>
      </g>
      {/* 건반 둘 */}
      <g>
      <circle cx="812" cy="48" r="16"/><path d="M798 38q12-13 28-2"/><path d="M806 48h.01M818 48h.01M806 56q6 4 12 0"/>
      <path d="M812 64q-2 26 0 50M812 76q-8 16 0 34M812 76q20 8 24 30"/>
      <path d="M888 34h28v28h-28z"/><path d="M896 45h.01M908 45h.01M897 54h10"/><path d="M902 62q2 26 0 52M902 76q-14 8-16 30M902 76q12 14 2 32"/>
      <g className="stroke-t-copper"><path d="M784 108l148 12v16l-148-12zM784 124l148 12"/><path d="M804 110v15M824 112v15M844 113v15M864 115v15M884 116v15M904 118v15"/><path d="M806 128l40 60M910 136l-40 52M846 188h-14M870 188h14"/></g>
      <path d="M812 114q-4 32-8 74M804 188h-12M902 114q4 32 8 74M910 188h12"/>
      </g>
      {/* 색소폰 */}
      <g>
      <circle cx="1000" cy="48" r="16"/><path d="M988 36q10-12 26-3"/><path d="M996 48h.01M1008 48h.01M998 56q5 4 10 0"/>
      <path d="M998 64q-6 32-6 62M992 126q-20 22-32 58M992 126q10 28 28 52M960 184h-12M1020 178h12"/>
      <path d="M998 78q-18 8-18 26t12 18M998 78q6 24 8 36"/>
      <g className="stroke-t-copper"><path d="M1014 58q18 6 16 22-3 26-4 42 0 22-20 22t-26-24q6 6 12 2"/><path d="M968 112q-4 12 6 16M1022 92h7M1020 104h7M1018 116h7"/></g>
      </g>
      {/* 바이올린 */}
      <g transform="translate(30)">
      <circle cx="1120" cy="48" r="16"/><path d="M1106 38q12-15 28-3"/><path d="M1114 48h.01M1126 48h.01M1115 56q5 4 11 0"/>
      <path d="M1120 64q2 32-2 64M1118 128q-16 26-28 56M1118 128q12 26 20 58M1090 184h-12M1138 186h12"/>
      <path d="M1120 78q-22 2-30-12M1120 78q-14 14-30 26"/>
      <g className="stroke-t-copper"><path d="M1108 62q-8-12-22-8t-16 2q-10 4-8 13t12 7q10 8 22 2t12-16z"/><path d="M1076 66l-26-10M1054 50l42 58"/></g>
      </g>
    </svg>
  );
}
