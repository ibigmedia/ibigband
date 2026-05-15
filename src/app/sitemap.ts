import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const SITE_URL = 'https://www.ibigband.com';

// 정적 경로 목록. /sheets/[id], /blog/[id] 등 동적 경로는
// 추후 Firestore에서 fetch해 확장 가능.
const STATIC_PATHS = [
  '',
  '/about',
  '/music',
  '/video',
  '/sheets',
  '/archive',
  '/seekers',
  '/blog',
  '/setlist',
  '/premium',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_PATHS.map((path) => {
    const koUrl = `${SITE_URL}${path || '/'}`;
    const enUrl = `${SITE_URL}/en${path}`;
    return {
      url: koUrl,
      lastModified: new Date(),
      alternates: {
        languages: {
          ko: koUrl,
          en: enUrl,
          'x-default': koUrl,
        },
      },
    };
  });
}
