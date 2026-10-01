import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'هاوڕێ | آشنایی ساده و امن',
  description:
    'هاوڕێ فضایی ساده و امن برای آشنایی است؛ پروفایل بسازید، افراد هم‌سلیقه را ببینید و در صورت علاقه دوطرفه گفت‌وگو کنید.',
  authors: [{ name: 'عبدالمتین پرچین' }],
  creator: 'عبدالمتین پرچین',
  applicationName: 'Hawre',
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  robots:
    process.env.NODE_ENV === 'production' && process.env.DISABLE_INDEXING !== 'true'
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f95c4b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* فونت فارسی Vazirmatn — در نبود اینترنت به Tahoma/سیستمی برمی‌گردد */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* اعمال تم پیش از رنگ‌آمیزی صفحه تا هیچ پرشی (FOUC) دیده نشود */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=localStorage.getItem('hawre_theme')||'system';var d=c==='dark'||(c==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}var l=localStorage.getItem('hawre_locale');if(l&&['fa','ckb','ar','en'].indexOf(l)>-1){document.documentElement.lang=l;document.documentElement.dir=(l==='en'?'ltr':'rtl');}}catch(e){}})();`,
          }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          رفتن به محتوای اصلی
        </a>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
