// گرفتن اسکرین‌شات از همه صفحات و ساخت یک گالری HTML مستقل (بدون نیاز به سرور برای دیدن)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.resolve('docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const USER = { email: 'armita@hawre.test', password: 'Test12345!' };
const ADMIN = { email: 'admin@hawre.test', password: 'Admin12345!' };

async function login(page, creds) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.fill('#email', creds.email);
  await page.fill('#password', creds.password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  await page.waitForTimeout(1500);
}

async function shot(page, url, name, title, { full = false, wait = 1800 } = {}) {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: full });
  console.log(`  📸 ${title} → ${path.relative(process.cwd(), file)}`);
  return { name, title, url, file };
}

const shots = [];

const browser = await chromium.launch();

// ---------- موبایل (۳۹۰×۸۴۴) ----------
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'fa-IR',
});
const mp = await mobile.newPage();
mp.setDefaultTimeout(20000);

console.log('\n▸ صفحات عمومی (موبایل)');
shots.push(await shot(mp, '/', 'm-landing', 'صفحه نخست (Landing)', { full: true }));
shots.push(await shot(mp, '/register', 'm-register', 'ثبت‌نام'));
shots.push(await shot(mp, '/login', 'm-login', 'ورود'));
shots.push(await shot(mp, '/forgot-password', 'm-forgot', 'فراموشی رمز عبور'));
shots.push(await shot(mp, '/terms', 'm-terms', 'قوانین استفاده', { full: true }));
shots.push(await shot(mp, '/privacy', 'm-privacy', 'حریم خصوصی', { full: true }));

console.log('\n▸ صفحات کاربر واردشده (موبایل)');
await login(mp, USER);
shots.push(await shot(mp, '/discover', 'm-discover', 'کاوش / سوایپ', { wait: 2500 }));
shots.push(await shot(mp, '/matches', 'm-matches', 'آشنایی‌ها (Matchها)', { wait: 2500 }));

// اولین چت موجود
let chatUrl = null;
try {
  await mp.goto(`${BASE}/matches`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(2500);
  const href = await mp.locator('a[href^="/chat/"]').first().getAttribute('href');
  if (href) chatUrl = href;
} catch {}
if (chatUrl) shots.push(await shot(mp, chatUrl, 'm-chat', 'گفت‌وگو', { wait: 2500 }));

let profileUrl = null;
try {
  await mp.goto(`${BASE}/discover`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(2500);
  const href = await mp.locator('a[href^="/profiles/"]').first().getAttribute('href');
  if (href) profileUrl = href;
} catch {}
if (profileUrl) shots.push(await shot(mp, profileUrl, 'm-profile-detail', 'جزئیات پروفایل', { full: true, wait: 2500 }));

shots.push(await shot(mp, '/profile', 'm-profile', 'ویرایش پروفایل', { full: true, wait: 2500 }));
shots.push(await shot(mp, '/settings', 'm-settings', 'تنظیمات', { full: true, wait: 2500 }));
shots.push(await shot(mp, '/report', 'm-report', 'گزارش و پشتیبانی', { full: true, wait: 2000 }));
await mobile.close();

// ---------- دسکتاپ (۱۲۸۰×۸۰۰) ----------
const desktop = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'fa-IR' });
const dp = await desktop.newPage();
dp.setDefaultTimeout(20000);

console.log('\n▸ نمای دسکتاپ');
shots.push(await shot(dp, '/', 'd-landing', 'صفحه نخست — دسکتاپ', { full: true }));
await login(dp, USER);
shots.push(await shot(dp, '/discover', 'd-discover', 'کاوش — دسکتاپ', { wait: 2500 }));
shots.push(await shot(dp, '/matches', 'd-matches', 'آشنایی‌ها — دسکتاپ', { wait: 2500 }));
await desktop.close();

// ---------- پنل مدیریت ----------
const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 860 }, locale: 'fa-IR' });
const ap = await adminCtx.newPage();
ap.setDefaultTimeout(20000);
console.log('\n▸ پنل مدیریت');
await login(ap, ADMIN);
shots.push(await shot(ap, '/admin', 'd-admin', 'پنل مدیریت — دسکتاپ', { full: true, wait: 3000 }));
await adminCtx.close();

// ---------- حالت تاریک (موبایل) ----------
console.log('\n▸ حالت تاریک');
const darkCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'fa-IR',
  colorScheme: 'dark',
});
const dk = await darkCtx.newPage();
dk.setDefaultTimeout(20000);
shots.push(await shot(dk, '/', 'k-landing-dark', 'صفحه نخست — حالت تاریک', { full: true }));
await login(dk, USER);
shots.push(await shot(dk, '/discover', 'k-discover-dark', 'کاوش — حالت تاریک', { wait: 2500 }));
shots.push(await shot(dk, '/matches', 'k-matches-dark', 'آشنایی‌ها — حالت تاریک', { wait: 2500 }));
if (chatUrl) shots.push(await shot(dk, chatUrl, 'k-chat-dark', 'گفت‌وگو — حالت تاریک', { wait: 2500 }));
shots.push(await shot(dk, '/settings', 'k-settings-dark', 'تنظیمات — حالت تاریک', { full: true, wait: 2500 }));

// ---------- زبان‌های دیگر (موبایل) ----------
console.log('\n▸ زبان‌ها');
for (const [code, title] of [
  ['ckb', 'کردی سۆرانی'],
  ['ar', 'العربية'],
  ['en', 'English'],
]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const lp = await ctx.newPage();
  lp.setDefaultTimeout(20000);
  await lp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await lp.evaluate((c) => localStorage.setItem('hawre_locale', c), code);
  await lp.reload({ waitUntil: 'networkidle' });
  await lp.waitForTimeout(2200);
  const file = path.join(OUT, `l-landing-${code}.png`);
  await lp.screenshot({ path: file, fullPage: true });
  shots.push({ name: `l-landing-${code}`, title: `صفحه نخست — ${title}`, url: '/', file });
  console.log(`  📸 صفحه نخست — ${title} → ${path.relative(process.cwd(), file)}`);
  await ctx.close();
}

await browser.close();

// ---------- ساخت گالری HTML مستقل ----------
const cards = shots
  .map((s) => {
    const b64 = fs.readFileSync(s.file).toString('base64');
    return `<figure class="card">
      <figcaption><span class="t">${s.title}</span><code>${s.url}</code></figcaption>
      <img alt="${s.title}" src="data:image/png;base64,${b64}">
    </figure>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>هاوڕێ — گالری تصویری صفحات</title>
<style>
  :root{--bg:#1b0c1a;--card:#2a1427;--ink:#fff4f1;--muted:#caa6c6;--accent:#ff7a45;--accent2:#f5455f}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,'Segoe UI',Tahoma,sans-serif;padding:28px}
  header{max-width:1200px;margin:0 auto 28px}
  h1{margin:0 0 8px;font-size:26px;background:linear-gradient(90deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
  p{margin:0;color:var(--muted);line-height:1.9;font-size:14px}
  .grid{max-width:1200px;margin:0 auto;display:grid;gap:22px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
  .card{margin:0;background:var(--card);border:1px solid #4a2340;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35)}
  figcaption{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid #4a2340}
  .t{font-weight:700;font-size:14px}
  code{color:var(--muted);font-size:11px;direction:ltr}
  img{display:block;width:100%;height:auto;background:#fff}
</style></head><body>
<header>
  <h1>هاوڕێ — گالری تصویری همه صفحات</h1>
  <p>این فایل کاملاً مستقل است: تصاویر داخل خود فایل جاسازی شده‌اند و بدون اجرای سرور هم باز می‌شود.
  نماهای موبایل با عرض ۳۹۰ پیکسل و نماهای دسکتاپ با عرض ۱۲۸۰ پیکسل گرفته شده‌اند.
  تاریخ ساخت: ${new Date().toLocaleString('fa-IR')} — تعداد تصاویر: ${shots.length}</p>
</header>
<div class="grid">
${cards}
</div>
</body></html>`;

fs.writeFileSync('docs/GALLERY.html', html);
console.log(`\n✅ گالری ساخته شد: docs/GALLERY.html (${shots.length} تصویر، ${(Buffer.byteLength(html) / 1048576).toFixed(1)} مگابایت)`);
