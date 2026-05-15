import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // /api, /_next, /_vercel, 정적 파일(점 포함 경로)은 미들웨어에서 제외한다.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
