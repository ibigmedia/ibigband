import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { prompt, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: '요청 내용이 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemPrompt = type === 'guide'
      ? `당신은 교회 예배/찬양 팀의 진행 가이드 작성 전문가입니다.
MC 멘트, 진행 가이드, 순서 안내 등을 자연스럽고 따뜻한 한국어로 작성합니다.
마크다운이나 특수 형식 없이 순수 텍스트로만 작성하세요.`
      : `당신은 교회 예배를 위한 기도문/멘트/원고 작성 전문가입니다.
기도문, 대표기도, 헌금기도, 봉헌기도, 환영인사, 광고멘트 등을 진심이 담긴 한국어로 작성합니다.
마크다운이나 특수 형식 없이 순수 텍스트로만 작성하세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\n요청: ${prompt}`,
    });

    const text = response.text || '';

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server Error';
    console.error('Text generation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
