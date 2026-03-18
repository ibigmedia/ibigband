import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import '@/lib/firebase/admin';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'uid is required' }, { status: 400 });
    }

    if (!admin.apps.length) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    // Firebase Admin으로 인증 링크 생성
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const verificationLink = await admin.auth().generateEmailVerificationLink(email, {
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ibighome.com'}/auth?verified=true`,
    });

    const displayName = userRecord.displayName || '회원';

    // 커스텀 HTML 이메일
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FAF9F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF9F6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- 헤더 -->
          <tr>
            <td style="background-color:#2D2926;padding:32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#2D2926;border-radius:12px;padding:0;">
                    <span style="font-size:32px;font-weight:bold;color:#E6C79C;letter-spacing:-0.5px;">ibiGband</span>
                  </td>
                </tr>
              </table>
              <p style="color:#E6C79C;font-size:14px;margin:8px 0 0;opacity:0.8;">Contemporary Warmth Archive</p>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#2D2926;font-size:22px;font-weight:bold;margin:0 0 8px;">이메일 인증 안내</h1>
              <p style="color:#78716A;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong style="color:#2D2926;">${displayName}</strong>님, 안녕하세요!<br/>
                ibiGband에 가입해 주셔서 감사합니다.
              </p>

              <p style="color:#78716A;font-size:14px;line-height:1.6;margin:0 0 28px;">
                아래 버튼을 클릭하여 이메일 인증을 완료해 주세요.
              </p>

              <!-- CTA 버튼 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" target="_blank"
                       style="display:inline-block;background-color:#2D2926;color:#E6C79C;font-size:16px;font-weight:bold;text-decoration:none;padding:16px 48px;border-radius:12px;letter-spacing:0.3px;">
                      이메일 인증하기
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 안내 박스 -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:32px;">
                <tr>
                  <td style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:20px;">
                    <p style="color:#92400E;font-size:14px;font-weight:bold;margin:0 0 8px;">가입 절차 안내</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:22px;height:22px;background-color:#F59E0B;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:bold;margin-right:8px;">1</span>
                          <span style="color:#92400E;font-size:13px;font-weight:bold;">이메일 인증 ← 지금 이 단계</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:22px;height:22px;background-color:#D1D5DB;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:bold;margin-right:8px;">2</span>
                          <span style="color:#78716A;font-size:13px;">관리자 승인 대기</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;">
                          <span style="display:inline-block;width:22px;height:22px;background-color:#D1D5DB;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:bold;margin-right:8px;">3</span>
                          <span style="color:#78716A;font-size:13px;">승인 완료 후 로그인</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 링크 직접 복사 -->
              <p style="color:#78716A;font-size:12px;line-height:1.5;margin:24px 0 0;text-align:center;">
                버튼이 작동하지 않으면 아래 링크를 브라우저에 직접 붙여넣어 주세요.
              </p>
              <p style="color:#E6C79C;font-size:11px;word-break:break-all;text-align:center;margin:8px 0 0;">
                <a href="${verificationLink}" style="color:#B8860B;text-decoration:underline;">${verificationLink}</a>
              </p>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="background-color:#F5F4F0;padding:24px 40px;text-align:center;border-top:1px solid #E5E2DD;">
              <p style="color:#78716A;font-size:12px;margin:0 0 4px;">
                본 메일을 요청하지 않으셨다면 무시하셔도 됩니다.
              </p>
              <p style="color:#A8A29E;font-size:11px;margin:0;">
                &copy; ibiGband · Contemporary Warmth Archive for CCM and Artists
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Resend로 이메일 발송
    const data = await resend.emails.send({
      from: 'ibiGband <hello@ibighome.com>',
      to: email,
      subject: 'ibiGband 이메일 인증을 완료해 주세요',
      html,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Verification email error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
