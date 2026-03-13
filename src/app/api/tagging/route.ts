import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { lyrics, title } = await req.json();

    if (!lyrics) {
      return NextResponse.json({ error: '가사 정보가 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API Key for Gemini is not present in environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // We request JSON format back from Gemini to easily parse it into our system
    const prompt = `다음 찬양 가사를 바탕으로 곡의 정보를 분석해서 JSON 형식으로 반환해줘.
제목: ${title}
가사: ${lyrics}
요구 응답 포맷 (JSON):
{
  "bpm": 120 (또는 다른 숫자),
  "key": "G" (코드 형식),
  "moodTags": ["은혜", "결단", "기쁨"],
  "summary": "가사를 바탕으로 한 1~2줄 요약글"
}
반드시 JSON 포맷만 출력해줘.\n`;

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
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
