import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { topic, keywords } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: '블로그 주제가 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key for Gemini is not present in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Blog content generation prompt
    const prompt = `당신은 기독교 음악(CCM)과 예배 인도자를 위한 전문적인 블로그 에디터입니다.
다음 주제와 키워드를 바탕으로 영감이 가득하고 전문적인 블로그 포스트를 작성해 주세요.
주제: ${topic}
키워드: ${keywords}

요구 응답 포맷 (JSON):
{
  "title": "블로그 포스트의 매력적인 제목",
  "content": "마크다운 형식으로 작성된 길고 상세한 본문 내용 (인사말, 본론, 결론, 성경 구절 포함 등)",
  "tags": ["태그1", "태그2", "태그3"],
  "imagePrompt": "해당 포스트의 썸네일이나 커버 이미지로 사용하기 좋은 미드저니/달리용 영문 프롬프트 문장"
}
반드시 한글로 작성해 주고 JSON 포맷만 출력해줘.\n`;

    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedData = JSON.parse(response.text || '{}');

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Gemini Blog Gen Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
