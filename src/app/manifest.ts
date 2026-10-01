import type { MetadataRoute } from 'next';

/**
 * مانیفست PWA — برنامه روی موبایل قابل «افزودن به صفحه اصلی» می‌شود
 * و مثل یک اپ مستقل (بدون نوار مرورگر) باز می‌شود.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'هاوڕێ — آشنایی ساده و امن',
    short_name: 'هاوڕێ',
    description: 'پلتفرم آزمایشی آشنایی آنلاین؛ پروفایل بسازید، افراد هم‌سلیقه را ببینید و در صورت علاقه دوطرفه گفت‌وگو کنید.',
    lang: 'fa',
    dir: 'rtl',
    start_url: '/discover',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fdf6f2',
    theme_color: '#f95c4b',
    categories: ['social', 'lifestyle'],
    icons: [
      { src: '/brand/mark-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/mark-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/mark-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'کاوش', url: '/discover' },
      { name: 'آشنایی‌ها', url: '/matches' },
      { name: 'پروفایل من', url: '/profile' },
    ],
  };
}
