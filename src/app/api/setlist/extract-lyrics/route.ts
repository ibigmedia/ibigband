import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { fileUrl, title } = await req.json();

    if (!fileUrl) {
      return NextResponse.json({ error: '파일 URL이 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 파일을 다운로드하여 base64로 변환
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) throw new Error('파일 다운로드 실패');

    const contentType = fileResponse.headers.get('content-type') || 'application/pdf';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const systemPrompt = `당신은 악보/찬양 가사 추출 전문가입니다.
주어진 악보 이미지/PDF에서 가사(lyrics)만 정확하게 추출해 주세요.

규칙:
1. 절(verse), 후렴(chorus), 브릿지(bridge) 등 구분은 [1절], [2절], [후렴], [브릿지] 형식으로 표시해 주세요
2. 각 절/후렴은 빈 줄로 구분해 주세요
3. 반복 기호가 있으면 가사를 반복하지 말고 [반복] 표시만 해주세요
4. 코드(Am, C, G7 등)는 제외하고 가사만 추출하세요
5. 악보에 가사가 없는 경우 "가사를 찾을 수 없습니다"라고 답변하세요
6. 곡 제목이 보이면 첫 줄에 제목을 적어주세요
7. 한국어, 영어, 스페인어 등 원본 언어 그대로 추출하세요
8. 프레젠테이션 슬라이드에 사용할 것이므로 깔끔하게 정리해 주세요
9. 절대 마크다운 문법(**, *, #, ## 등)을 사용하지 마세요. 순수 텍스트로만 작성하세요
10. "곡 제목:" 같은 불필요한 접두어 없이 가사 내용만 출력하세요`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\n곡 제목: ${title || '알 수 없음'}\n\n이 악보에서 가사를 추출해 주세요.` },
            {
              inlineData: {
                mimeType: contentType.startsWith('image/') ? contentType : 'application/pdf',
                data: base64,
              },
            },
          ],
        },
      ],
    });

    let lyrics = response.text || '';

    // 마크다운 문법 후처리 제거
    lyrics = lyrics
      .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** → bold
      .replace(/\*([^*]+)\*/g, '$1')        // *italic* → italic
      .replace(/^#{1,6}\s+/gm, '')          // ## 헤딩 제거
      .replace(/^```[\s\S]*?```$/gm, '')    // 코드블록 제거
      .trim();

    if (!lyrics) {
      return NextResponse.json({ error: '가사를 추출할 수 없습니다.' }, { status: 400 });
    }

    return NextResponse.json({ lyrics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server Error';
    console.error('Lyrics extraction error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
