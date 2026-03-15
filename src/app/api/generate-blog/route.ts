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
    const prompt = `당신은 기독교 음악(CCM)과 예배 인도자를 위한 전문적인 영적 블로그 에디터입니다.
주제: ${topic}
키워드: ${keywords}

위 사항을 바탕으로 영감이 가득하고 전문적인 블로그 포스트를 '마크다운(Markdown)' 형식으로 작성해 주세요.
* 중요 요구사항:
1. 글 중간중간에 주제와 어울리는 고품질 이미지를 자동으로 생성해 삽입해 주세요. (2~3개)
   - 이미지 삽입 방식 (마크다운 포맷):
     ![이미지 설명](https://image.pollinations.ai/prompt/영어로_표현된_이미지_묘사_cinematic_minimalist_worship_atmosphere?width=800&height=400&nologo=true)
   * 예시: ![worship team](https://image.pollinations.ai/prompt/worship%20band%20playing%20on%20stage%20warm%20lighting%20cinematic?width=800&height=400&nologo=true)
2. 글의 구성은 서론(인사말/도입), 본론(소제목 여러 개 적용), 결론(요약/적용) 형태를 띄어야 합니다.
3. 소제목(#, ##, ###), 강조(**굵게**), 인용구(>), 성경 구절 등을 적극 활용해 주세요.
4. 연관 해시태그 3~5개를 배열 형태로 함께 반환해 주세요.

요구 응답 포맷 (이 JSON 형태만 반환할 것):
{
  "title": "블로그 포스트의 매력적인 제목",
  "content": "마크다운 형식으로 작성된 길고 상세한 본문 내용 (위의 지시대로 작성)",
  "tags": ["태그1", "태그2", "태그3"],
  "imagePrompt": "해당 포스트의 메인 썸네일(Cover Image)용 미드저니/달리 영문 프롬프트 문장"
}
`;

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
