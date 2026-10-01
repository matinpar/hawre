import type { MetadataRoute } from 'next';

/** فقط صفحات عمومی؛ صفحات نیازمند ورود در نقشه سایت نمی‌آیند. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const now = new Date();
  return ['', '/login', '/register', '/forgot-password', '/terms', '/privacy', '/report'].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.6,
  }));
}
