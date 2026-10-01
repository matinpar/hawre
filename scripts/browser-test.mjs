/**
 * تست مرورگر واقعی (Playwright) برای جریان ورود.
 * سه سناریو:
 *  ۱) مرورگر عادی (کوکی فعال)
 *  ۲) مرورگر با کوکی کاملاً مسدود  → باید با توکن وارد شود
 *  ۳) مرورگر با کوکی و localStorage/sessionStorage مسدود → باید با حافظه موقت وارد شود
 *
 * اجرا:  node scripts/browser-test.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL ?? 'armita@hawre.test';
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Test12345!';

let pass = 0;
let fail = 0;
function check(name, ok, extra = '') {
  if (ok) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name} ${extra}`);
    fail++;
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  // منتظر می‌مانیم React هیدریت شود تا مقادیر فرم بازنویسی نشوند
  await page.waitForTimeout(1500);
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.waitForTimeout(200);
  const typed = await page.inputValue('#email');
  if (typed !== EMAIL) throw new Error(`فرم درست پر نشد: ${typed}`);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
}

async function scenario(title, { blockCookies = false, blockStorage = false }) {
  console.log(`▶ ${title}`);
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();

  if (blockCookies) {
    // هر Set-Cookie را حذف و هر ارسال کوکی را قطع می‌کنیم
    await context.route('**/*', async (route) => {
      const headers = { ...route.request().headers() };
      delete headers.cookie;
      await route.continue({ headers });
    });
    await context.addInitScript(() => {
      Object.defineProperty(document, 'cookie', { get: () => '', set: () => {}, configurable: true });
    });
  }
  if (blockStorage) {
    await context.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('storage blocked', 'SecurityError');
      };
      for (const key of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(window, key, {
          get: () => ({ getItem: blocked, setItem: blocked, removeItem: blocked, clear: blocked }),
          configurable: true,
        });
      }
    });
  }

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (blockCookies) {
    await context.clearCookies();
    page.on('response', async () => context.clearCookies().catch(() => {}));
  }

  await login(page);

  const url = page.url();
  check(`${title} → هدایت به صفحه کاوش`, url.includes('/discover'), `(آدرس فعلی: ${url})`);

  const bodyText = await page.textContent('body').catch(() => '');
  check(`${title} → کارت پروفایل نمایش داده شد`, /کاوش/.test(bodyText ?? ''), '');
  const hasCard = await page.locator('.swipe-card').count();
  check(`${title} → دیتای کاربر بارگذاری شد`, hasCard > 0 || /پروفایل تازه‌ای نیست/.test(bodyText ?? ''));

  const visibleError = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  check(`${title} → بدون پیام خطا`, !visibleError, visibleError ? `(${visibleError.trim()})` : '');
  check(`${title} → بدون خطای اجرایی جاوااسکریپت`, errors.length === 0, errors[0] ?? '');

  await browser.close();
}

await scenario('۱) مرورگر عادی', {});
await scenario('۲) کوکی مسدود', { blockCookies: true });
await scenario('۳) کوکی + ذخیره‌سازی مسدود', { blockCookies: true, blockStorage: true });

console.log('\n──────────────────────────────');
console.log(`موفق: ${pass}    ناموفق: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
