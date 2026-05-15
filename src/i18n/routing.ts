import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  // 기본 언어(ko)는 URL prefix 없이 사용하고, en만 /en 경로로 분리한다.
  localePrefix: 'as-needed',
});
