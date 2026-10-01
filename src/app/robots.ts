import type { MetadataRoute } from 'next';

/**
 * نسخه آزمایشی است و ایندکس نمی‌شود؛ صفحات خصوصی هم صراحتاً مسدود شده‌اند.
 * برای انتشار عمومی کافی است disallow را به مسیرهای خصوصی محدود کنید.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const isProd = process.env.NODE_ENV === 'production' && process.env.PUBLIC_INDEXING === 'true';

  return {
    rules: isProd
      ? [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/discover', '/matches', '/chat', '/profile', '/settings'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  };
}
