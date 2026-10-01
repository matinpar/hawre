/** تست ورود داخل iframe با دامنه متفاوت (شبیه‌سازی محیط پیش‌نمایش) */
import { chromium } from 'playwright';

const EMAIL = process.env.TEST_EMAIL ?? 'armita@hawre.test';
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Test12345!';
let pass = 0, fail = 0;
const check = (n, ok, extra = '') => (ok ? (console.log(`  ✅ ${n}`), pass++) : (console.log(`  ❌ ${n} ${extra}`), fail++));

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const context = await browser.newContext();

// شبیه‌سازی مرورگری که در بستر شخص‌ثالث، کوکی و ذخیره‌سازی را مسدود می‌کند
await context.addInitScript(() => {
  if (window.top !== window.self) {
    Object.defineProperty(document, 'cookie', { get: () => '', set: () => {}, configurable: true });
    const blocked = () => { throw new DOMException('storage blocked', 'SecurityError'); };
    for (const key of ['localStorage', 'sessionStorage']) {
      Object.defineProperty(window, key, {
        get: () => ({ getItem: blocked, setItem: blocked, removeItem: blocked, clear: blocked }),
        configurable: true,
      });
    }
  }
});
await context.route('**/localhost:3000/**', async (route) => {
  const headers = { ...route.request().headers() };
  delete headers.cookie;
  await route.continue({ headers });
});

const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle' });
const frame = page.frameLocator('#f');
await page.waitForTimeout(2000);
await frame.locator('#email').fill(EMAIL);
await frame.locator('#password').fill(PASSWORD);
await context.clearCookies();
await frame.locator('button[type="submit"]').click();
await page.waitForTimeout(5000);
await context.clearCookies();

const frameUrl = page.frames().map((f) => f.url()).find((u) => u.includes('localhost:3000')) ?? '';
check('ورود داخل iframe → رفتن به صفحه کاوش', frameUrl.includes('/discover'), `(${frameUrl})`);
const text = await frame.locator('body').textContent().catch(() => '');
check('محتوای برنامه بارگذاری شد', /کاوش|آشنایی/.test(text ?? ''));
check('هشدار نشستِ موقت به کاربر نشان داده شد', /نشست شما فقط تا زمان باز بودن/.test(text ?? ''));
check('بدون خطای جاوااسکریپت', errors.length === 0, errors[0] ?? '');

await page.waitForTimeout(500);
await browser.close();
console.log(`\nموفق: ${pass}    ناموفق: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
