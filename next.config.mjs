const isProd = process.env.NODE_ENV === 'production';

/**
 * دامنه‌هایی که اجازه دارند برنامه را داخل iframe نمایش دهند.
 * در حالت توسعه برای کار کردن پیش‌نمایش (Preview) لازم است؛
 * در Production به‌صورت پیش‌فرض هیچ دامنه‌ای مجاز نیست.
 */
const frameAncestors = (process.env.ALLOWED_FRAME_ANCESTORS ?? (isProd ? "'self'" : "'self' https://*.e2b.app https://*.arena.ai"))
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // خروجی standalone برای ایمیج سبک Docker (فقط فایل‌های لازم کپی می‌شوند)
  output: 'standalone',
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // به‌جای X-Frame-Options از CSP استفاده می‌کنیم تا در محیط پیش‌نمایش قابل تنظیم باشد
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), camera=(), microphone=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
