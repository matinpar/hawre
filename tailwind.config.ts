import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // حالت تاریک با کلاس `dark` روی <html> کنترل می‌شود (انتخاب کاربر یا ترجیح سیستم)
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* پالت «غروب»: مرجانی/نارنجی گرم روی بادمجانی تیره */
        brand: {
          50: '#fff4f1', 100: '#ffe6df', 200: '#ffcabd', 300: '#ffa48d',
          400: '#ff7d63', 500: '#f95c4b', 600: '#e23f38', 700: '#bd2d2e',
          800: '#97262a', 900: '#7a2328', 950: '#420f13',
        },
        amber: {
          50: '#fff8ed', 100: '#fff0d6', 200: '#ffdda8', 300: '#ffc46f',
          400: '#ffa93c', 500: '#fb9018', 600: '#e0700e', 700: '#ba520f',
        },
        plum: {
          50: '#f9f4f8', 100: '#f2e7f0', 200: '#e3cde0', 300: '#caa6c6',
          400: '#a9749f', 500: '#8b5280', 600: '#713e68', 700: '#5c3355',
          800: '#3d2039', 900: '#2a1427', 950: '#1b0c1a',
        },
        coral: {
          50: '#fff1f3', 100: '#ffe1e6', 200: '#ffc7d0', 300: '#fb95a7',
          400: '#f4637e', 500: '#e5375c', 600: '#c92249', 700: '#a5173c',
        },
        /* خاکستری‌های گرم: جایگزین slate سرد پیش‌فرض در کل پروژه */
        slate: {
          50: '#fbf8f7', 100: '#f5efec', 200: '#e9dfda', 300: '#d6c7c1',
          400: '#a8968f', 500: '#7d6b66', 600: '#5f4f4b', 700: '#463a38',
          800: '#2f2624', 900: '#1f1817', 950: '#140f0f',
        },
        ink: '#2a1427',
        mist: '#fdf6f2',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: { xl2: '1.5rem', '4xl': '2rem', '5xl': '2.5rem' },
      boxShadow: {
        soft: '0 8px 24px -12px rgba(66, 15, 19, 0.20)',
        card: '0 22px 50px -24px rgba(66, 15, 19, 0.38)',
        lift: '0 30px 70px -30px rgba(66, 15, 19, 0.50)',
        glow: '0 12px 34px -12px rgba(249, 92, 75, 0.55)',
        glowCoral: '0 12px 34px -12px rgba(229, 55, 92, 0.50)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,.65)',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg,#f5455f 0%,#ff7a45 52%,#ffaf4b 100%)',
        'brand-grad-soft': 'linear-gradient(135deg,#fff4f1 0%,#fff8ed 100%)',
        'plum-grad': 'linear-gradient(140deg,#2a1427 0%,#5c3355 55%,#e23f38 130%)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        floatUp: { '0%': { transform: 'translateY(14px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        floatSlow: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '100%': { transform: 'translateX(-100%)' } },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%,-3%,0) scale(1.08)' },
        },
        ping2: { '0%': { transform: 'scale(1)', opacity: '.6' }, '100%': { transform: 'scale(1.8)', opacity: '0' } },
      },
      animation: {
        pop: 'pop .3s cubic-bezier(.2,.9,.3,1.3)',
        floatUp: 'floatUp .45s cubic-bezier(.2,.7,.3,1) both',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        drift: 'drift 18s ease-in-out infinite',
        ping2: 'ping2 1.8s cubic-bezier(0,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
};
export default config;
