import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: '주제가 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key for Gemini is not present in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `당신은 기독교 구도자(Seekers)를 위한 진정성 있는 질문과 답변을 작성하는 전문가입니다.
주제: ${topic}

이 주제에 대해 구도자들이 가장 궁금해할 만한 핵심 질문 1개를 선정하고, 그에 대한 명쾌하고 따뜻한 답변을 작성해주세요. 
기독교의 핵심 진리를 담되, 비신자도 이해할 수 있는 쉬운 언어와 공감하는 태도를 유지해야 합니다.

요구 응답 포맷 (반드시 JSON 형태만 반환할 것):
{
  "category": "분류 (존재와 우주, 역사와 문서, 과학과 신앙, 고통과 공의, 교회와 종교, 개인과 신앙 중 하나를 선택하여, 각각 existence, history, science, pain, church, personal 중 하나의 id 값을 반환하세요)",
  "question": "구도자의 시선에서 던지는 질문 (한글)",
  "questionEn": "위 질문의 자연스러운 영어 번역",
  "keywords": "검색용 띄어쓰기 구분 키워드 (예: ${topic.replace(/\s+/g, ' ')} god evidence bible)",
  "shortAnswer": "답변을 1-2문장으로 요약한 핵심 문구 (강조하고 싶은 부분에 <br/> 태그 사용 가능)",
  "fullAnswer": "<p class=\\"mb-4\\">로 시작하는 HTML 태그를 포함한 3-4문단의 상세하고 깊이 있는 답변 본문. 중요 키워드는 <strong class=\\"text-[#2D2926] font-normal\\">키워드</strong>로 강조하세요.",
  "media": [
    {
      "type": "video",
      "title": "관련 추천 영상 제목",
      "subtitle": "추천 영상 설명 (짧게)",
      "link": "https://www.youtube.com/watch?v=xxx (유튜브 예시 링크 또는 관련 링크)"
    }
  ]
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

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Seekers Gen Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
