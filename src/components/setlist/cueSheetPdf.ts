import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface CueItem {
  type: string;
  title: string;
  author?: string;
  duration?: string;
  note?: string;
  hasPdf?: boolean;
  hasAudio?: boolean;
}

interface ScheduleItem {
  time: string;
  title: string;
  type: string;
  date?: string;
  location?: string;
  memo?: string;
}

/**
 * 큐시트를 한글 지원 PDF로 생성합니다.
 * Pretendard 폰트를 사용하여 한글/영문 모두 정상 출력됩니다.
 */
export async function generateCueSheetPdf(
  title: string,
  items: CueItem[],
  totalDuration: string,
  schedules?: ScheduleItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 한글 폰트 로드
  const [regularBytes, boldBytes] = await Promise.all([
    fetch('/fonts/Pretendard-Regular.otf').then(r => r.arrayBuffer()),
    fetch('/fonts/Pretendard-Bold.otf').then(r => r.arrayBuffer()),
  ]);

  const font = await pdfDoc.embedFont(regularBytes);
  const fontBold = await pdfDoc.embedFont(boldBytes);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;

  const dark = rgb(0.176, 0.161, 0.149);   // #2D2926
  const gold = rgb(0.902, 0.78, 0.612);     // #E6C79C
  const gray = rgb(0.47, 0.44, 0.42);       // #78716A
  const lightBg = rgb(0.98, 0.976, 0.965);  // #FAF9F6
  const white = rgb(1, 1, 1);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // === 상단 골드 바 ===
  page.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: gold });

  // === 제목 ===
  const displayTitle = title || '셋리스트';
  page.drawText(displayTitle, { x: margin, y: y - 20, font: fontBold, size: 22, color: dark });
  y -= 28;

  // === 부제목 ===
  const subtitle = `${items.length}곡 · 총 ${totalDuration} · ibiGband 스마트 큐시트`;
  page.drawText(subtitle, { x: margin, y: y - 12, font, size: 9, color: gray });
  y -= 30;

  // === 구분선 ===
  page.drawRectangle({ x: margin, y, width: pageWidth - margin * 2, height: 1, color: gold });
  y -= 20;

  // === 테이블 헤더 ===
  const colWidths = [30, 60, 180, 100, 45, 100];
  const headers = ['#', '구분', '제목', '아티스트', '시간', '비고'];
  const headerY = y;
  page.drawRectangle({ x: margin, y: headerY - 4, width: pageWidth - margin * 2, height: 22, color: dark });

  let xPos = margin + 6;
  headers.forEach((h, i) => {
    page.drawText(h, { x: xPos, y: headerY + 2, font: fontBold, size: 8, color: white });
    xPos += colWidths[i];
  });
  y -= 28;

  // === 타입 한글 라벨 ===
  const typeLabels: Record<string, string> = {
    sheet: '악보', mr: 'MR/트랙', bgm: 'BGM', transcript: '멘트/원고', guide: '가이드'
  };

  // 텍스트 잘림 처리 (폰트 기반)
  const truncate = (text: string, maxWidth: number, f: typeof font, size: number) => {
    if (!text) return '';
    let t = text;
    while (t.length > 0 && f.widthOfTextAtSize(t, size) > maxWidth) {
      t = t.slice(0, -1);
    }
    if (t.length < text.length) t = t.slice(0, -1) + '…';
    return t;
  };

  // === 테이블 행 ===
  for (let i = 0; i < items.length; i++) {
    if (y < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    const item = items[i];
    const rowBg = i % 2 === 0 ? lightBg : white;
    page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 22, color: rowBg });

    xPos = margin + 6;
    const rowData = [
      { text: String(i + 1), f: fontBold, size: 9, color: dark },
      { text: typeLabels[item.type] || item.type, f: font, size: 8, color: gray },
      { text: truncate(item.title, colWidths[2] - 10, fontBold, 8), f: fontBold, size: 8, color: dark },
      { text: truncate(item.author || '', colWidths[3] - 10, font, 8), f: font, size: 8, color: gray },
      { text: item.duration || '-', f: font, size: 8, color: gray },
      { text: truncate(item.note || '', colWidths[5] - 10, font, 7), f: font, size: 7, color: gray },
    ];

    rowData.forEach((d, ci) => {
      page.drawText(d.text, { x: xPos, y: y + 2, font: d.f, size: d.size, color: d.color });
      xPos += colWidths[ci];
    });

    y -= 24;
  }

  // === 일정 타임라인 (있을 경우) ===
  if (schedules && schedules.length > 0) {
    y -= 16;
    if (y < margin + 100) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }

    page.drawRectangle({ x: margin, y, width: pageWidth - margin * 2, height: 1, color: gold });
    y -= 20;

    page.drawText('📅 일정 타임라인', { x: margin, y, font: fontBold, size: 12, color: dark });
    y -= 20;

    const schedTypeLabels: Record<string, string> = {
      event: '🎵 예배/공연', practice: '🎸 연습', travel: '🚗 이동', rehearsal: '🎤 리허설', notice: '📢 공지'
    };

    // 일정 테이블 헤더
    const schedCols = [55, 65, 160, 100, 115];
    const schedHeaders = ['시간', '구분', '내용', '장소', '메모'];
    page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 20, color: dark });
    xPos = margin + 6;
    schedHeaders.forEach((h, i) => {
      page.drawText(h, { x: xPos, y: y + 1, font: fontBold, size: 7, color: white });
      xPos += schedCols[i];
    });
    y -= 24;

    for (let i = 0; i < schedules.length; i++) {
      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      const s = schedules[i];
      const rowBg = i % 2 === 0 ? lightBg : white;
      page.drawRectangle({ x: margin, y: y - 4, width: pageWidth - margin * 2, height: 20, color: rowBg });

      xPos = margin + 6;
      const timeStr = s.date ? `${s.date.slice(5)} ${s.time}` : s.time;
      const schedRowData = [
        { text: timeStr, f: fontBold, size: 8, color: dark },
        { text: truncate(schedTypeLabels[s.type] || s.type, schedCols[1] - 6, font, 7), f: font, size: 7, color: gray },
        { text: truncate(s.title, schedCols[2] - 6, fontBold, 8), f: fontBold, size: 8, color: dark },
        { text: truncate(s.location || '-', schedCols[3] - 6, font, 7), f: font, size: 7, color: gray },
        { text: truncate(s.memo || '', schedCols[4] - 6, font, 7), f: font, size: 7, color: gray },
      ];

      schedRowData.forEach((d, ci) => {
        page.drawText(d.text, { x: xPos, y: y + 1, font: d.f, size: d.size, color: d.color });
        xPos += schedCols[ci];
      });
      y -= 22;
    }
  }

  // === 푸터 ===
  y -= 20;
  if (y < margin + 30) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }
  page.drawRectangle({ x: margin, y, width: pageWidth - margin * 2, height: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 16;
  page.drawText('ibiGband 스마트 셋리스트에서 생성됨 · ibigband.com', { x: margin, y, font, size: 7, color: gray });

  return pdfDoc.save();
}
