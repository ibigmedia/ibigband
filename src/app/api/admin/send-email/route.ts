import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// .env.local에 RESEND_API_KEY를 추가해야 작동합니다.
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: 'IBIG Band <hello@ibighome.com>', // 요청하신 hello@ibighome.com 메일 주소 사용
      to,
      subject,
      html,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
