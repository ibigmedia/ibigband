# ibigband.com 프로젝트 지침

## 사이트 개요
- 사이트: https://www.ibigband.com
- 목적: CCM/복음 음악 플랫폼 (악보 아카이브, 멤버십, 찬양 콘텐츠)
- 운영 상태: 현재 운영 중

## 기술 스택
- Framework: Next.js + TypeScript
- Database: Firebase (Firestore + Firebase Storage)
- API: https://www.ibigband.com/api (tracks/sheets/media)
- 배포: Vercel
- MP3: Firebase Storage에 저장, 여러 사이트에서 공유 재생

## 연관 사이트 연동
- giljabi.com에서 ibigband 유틸 파일 사용
  경로: packages/app/utils/ibigband.ts
- ibigmission.org에서 ibigband 음악섹션 연동

## 디자인 시스템
- 컨셉: 길잡이(giljabi.com)와 같은 계열. 라이트 모드 전용
- 배경: 종이색 #F5F2EC, 카드 #FFFDF9, 선 #E0DBD0
- 글자: 먹색 #121110, 보조 글자는 `text-t-muted` · `text-t-soft`
- 포인트: 주황 #E8481C(칠·표시), 녹슨 주황 #B3350F(밝은 바탕 글자·흰 글자 버튼)
- 폰트: 제목 Inter + Noto Sans KR 800, 본문 Inter + Noto Sans KR, 로고 글자만 손글씨(`font-wordmark`, Nanum Pen)
- 글자색 토큰(`text-t-muted`, `text-t-copper`, `text-t-gold`, `text-t-soft`)은 바탕에 따라 값이 바뀐다. 새 어두운 구획은 globals.css의 범위 목록에 추가한다
- 본문·보조 글자 대비 4.5:1 이상, 글자 12px 이상
- 히어로 일러스트: `HeroBand`(SVG), 로고 마크: `BandMark`(SVG)
- 절대 금지: 다크모드, 인디고/퍼플/파란 계열

## 주요 기능
- 트랙 아카이브 (MP3 스트리밍)
- 악보 다운로드
- 멤버십 티어 시스템
- 찬양 콘텐츠/묵상 블로그
- YouTube 연동

## 콘텐츠 톤
- 신앙 기반 CCM/복음 음악
- 한국어 우선, 영어 병행
- 따뜻하고 영적인 분위기

## 작업 시 주의사항
- Firebase Firestore 스키마 변경 시 반드시 확인
- MP3 파일은 Firebase Storage 경로 유지
- API 엔드포인트 변경 시 giljabi.com, ibigmission.org 영향 확인
- 항상 위 디자인 시스템 참고

## 소통 규칙
- 모든 주석, 질문, 보고, 커밋 메시지를 **한국어**로 작성
