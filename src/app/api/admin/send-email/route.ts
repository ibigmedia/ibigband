import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyAdmin, isErrorResponse } from '@/lib/api-auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin(request);
    if (isErrorResponse(authResult)) return authResult;

    const { to, subject, html, attachments } = await request.json();

    const emailOptions: any = {
      from: 'IBIG Band <hello@ibighome.com>',
      to,
      subject,
      html,
    };

    // attachments format: [{ filename: 'cuesheet.pdf', content: '<base64string>' }]
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
      }));
    }

    const data = await resend.emails.send(emailOptions);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
