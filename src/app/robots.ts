import type { MetadataRoute } from 'next';

/**
 * در Production صفحات عمومی ایندکس می‌شوند و مسیرهای خصوصی مسدود می‌مانند.
 * برای خاموش‌کردن موقت ایندکس (مثلاً هنگام راه‌اندازی) کافی است
 * متغیر محیطی DISABLE_INDEXING=true تنظیم شود.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const live = process.env.NODE_ENV === 'production' && process.env.DISABLE_INDEXING !== 'true';

  return {
    rules: live
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin', '/discover', '/matches', '/chat', '/profile', '/settings', '/onboarding'],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
