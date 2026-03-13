import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { lyrics, title } = await req.json();

    if (!lyrics) {
      return NextResponse.json({ error: '가사 정보가 필요합니다.' }, { status: 400 });
    }

    // 실제 환경: 구글 제미나이 SDK 연동 (예: @google/genai) 
    // const { GoogleGenAI } = require('@google/genai');
    // const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // const prompt = `다음 찬양 가사를 바탕으로 곡의 BPM, Mood, Key를 추론하고 요약해줘.\n제목:${title}\n가사:\n${lyrics}`;
    // const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    // const text = response.text();

    // 임시 더미(Dummy) 응답 로직
    const dummyAiResponse = {
      bpm: 110,
      key: "G",
      moodTags: ["은혜로운", "결단", "위로"],
      summary: "이 찬양은 모든 것이 하나님의 은혜임을 고백하며, 삶의 고독 속에서도 주님을 의지하겠다는 신앙적 고백과 결단을 담고 있습니다."
    };

    return NextResponse.json({ success: true, data: dummyAiResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
