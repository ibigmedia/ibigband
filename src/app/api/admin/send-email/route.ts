import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyAdmin, isErrorResponse } from '@/lib/api-auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: 'IBIG Band <hello@ibighome.com>',
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
