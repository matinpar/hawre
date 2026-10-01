'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { LanguageQuickSwitcher } from '@/components/LanguageSwitcher';
import {
  IconCamera,
  IconChat,
  IconCheck,
  IconClose,
  IconCompass,
  IconHeartFilled,
  IconLock,
  IconMail,
  IconPin,
  IconShield,
  IconSparkle,
  IconUndo,
} from '@/components/Icons';

const FEATURES = [
  {
    title: 'پروفایل ساده و شفاف',
    body: 'چند عکس، یک معرفی کوتاه و علاقه‌مندی‌ها؛ همین کافی است تا دیده شوید.',
    Icon: IconCamera,
  },
  {
    title: 'انتخاب با یک حرکت',
    body: 'کارت‌ها را به چپ و راست بکشید یا با دکمه‌ها انتخاب کنید؛ روی موبایل و دسکتاپ یکسان روان است.',
    Icon: IconCompass,
  },
  {
    title: 'گفت‌وگو فقط با علاقه دوطرفه',
    body: 'تا وقتی هر دو طرف یکدیگر را نپسندند، هیچ پیامی رد و بدل نمی‌شود.',
    Icon: IconChat,
  },
];

const STEPS = [
  { n: '۱', title: 'حساب بسازید', body: 'با ایمیل و رمز عبور یا حساب Google، بدون نیاز به شماره موبایل.' },
  { n: '۲', title: 'پروفایل را کامل کنید', body: 'نام نمایشی، سن، شهر، معرفی کوتاه و دست‌کم یک عکس.' },
  { n: '۳', title: 'کاوش کنید', body: 'پروفایل‌های پیشنهادی را ببینید و انتخاب کنید.' },
  { n: '۴', title: 'گفت‌وگو کنید', body: 'با علاقه دوطرفه، یک گفت‌وگوی خصوصی باز می‌شود.' },
];

const PRIVACY = [
  'رمز عبور به‌صورت هش‌شده ذخیره می‌شود و هرگز قابل بازیابی نیست.',
  'ایمیل شما هیچ‌وقت به کاربران دیگر نمایش داده نمی‌شود.',
  'مکان دقیق ذخیره نمی‌شود؛ فقط شهر و فاصله تقریبی.',
  'مسدود کردن، گزارش کاربر و حذف کامل حساب در هر زمان.',
  'حداقل سن استفاده از سرویس ۱۸ سال است.',
];

const NOT_INCLUDED = ['بدون پرداخت و اشتراک', 'بدون تبلیغات', 'بدون Boost و Super Like', 'بدون ردیابی مکان دقیق'];

export default function LandingContent() {
  const t = useT();

  return (
    <div className="nv-bg min-h-screen">
      {/* هاله ملایم پس‌زمینه (فقط یک لایه، برای سبک‌تر شدن فضا) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] overflow-hidden">
        <span className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
        <span className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl" />
      </div>

      {/* ---------- هدر ---------- */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex">
              <LanguageQuickSwitcher />
            </span>
            <Link href="/login" className="nv-btn-ghost whitespace-nowrap text-sm">
              {t('ورود')}
            </Link>
            <Link href="/register" className="nv-btn-primary whitespace-nowrap text-sm">
              {t('ثبت‌نام رایگان')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto max-w-5xl px-4">
        {/* ---------- قهرمان ---------- */}
        <section className="grid items-center gap-10 py-8 md:gap-14 md:py-16 lg:grid-cols-[1.05fr_.95fr]">
          <div className="animate-floatUp text-center lg:text-right">
            <span className="nv-pill">
              <IconSparkle size={14} />
              {t('نسخه آزمایشی و کاملاً رایگان')}
            </span>

            <h1 className="mx-auto mt-5 max-w-xl text-[2.1rem] font-extrabold leading-[1.4] tracking-tight text-ink sm:text-[2.7rem] lg:mx-0 lg:text-[3.2rem] lg:leading-[1.3]">
              {t('آشنایی تازه،')} <span className="nv-gradient-text">{t('بدون شلوغی')}</span> {t('و بدون هزینه')}
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-9 text-slate-600 lg:mx-0">
              {t(
                'هاوڕێ یک فضای ساده برای پیدا کردن آدم‌های هم‌سلیقه است. پروفایل بسازید، افراد پیشنهادی را ببینید و اگر علاقه دوطرفه بود، گفت‌وگو را شروع کنید.',
              )}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/register" className="nv-btn-primary px-7 py-3.5 text-base">
                {t('ساخت حساب رایگان')}
              </Link>
              <Link href="/login" className="nv-btn-secondary px-7 py-3.5 text-base">
                {t('ورود به حساب')}
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500 lg:justify-start">
              <li className="inline-flex items-center gap-1.5">
                <IconMail size={15} className="text-brand-500" /> {t('ورود با ایمیل')}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <IconLock size={15} className="text-brand-500" /> {t('یا حساب Google')}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <IconShield size={15} className="text-brand-500" /> {t('بدون نیاز به شماره موبایل')}
              </li>
            </ul>
          </div>

          {/* ماکت کارت کاوش */}
          <div className="relative mx-auto w-full max-w-[19rem]">
            <div aria-hidden className="absolute inset-x-7 top-5 h-full rounded-[2rem] bg-white/70 shadow-soft" />
            <div aria-hidden className="absolute inset-x-3.5 top-2.5 h-full rounded-[2rem] bg-white/85 shadow-soft" />

            <div className="nv-card relative overflow-hidden rounded-[2rem] p-0 shadow-card">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-grad">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/seed/girl-1.jpg"
                  alt="نمونه کارت پروفایل در هاوڕێ"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-xl font-extrabold drop-shadow">نمونه پروفایل، ۲۷ ساله</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-2xs font-bold text-white/90">
                    <IconPin size={13} /> تهران • حدود ۵ کیلومتر
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {['کتاب', 'کوهنوردی', 'قهوه'].map((i) => (
                      <span
                        key={i}
                        className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-2xs font-bold backdrop-blur"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* دکمه‌های ماکت: قلب راست، ضربدر چپ */}
              <div className="flex items-center justify-center gap-4 py-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-grad text-white shadow-glow">
                  <IconHeartFilled size={21} />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 text-slate-300">
                  <IconUndo size={15} />
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-coral-100 bg-white text-coral-500 shadow-soft">
                  <IconClose size={21} />
                </span>
              </div>
            </div>

            <span className="absolute -left-4 top-32 hidden rounded-2xl bg-white px-3.5 py-2.5 shadow-lift lg:block">
              <span className="flex items-center gap-2 text-2xs font-extrabold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-grad text-white">
                  <IconHeartFilled size={13} />
                </span>
                آشنایی دوطرفه!
              </span>
              <span className="mt-0.5 block text-[0.6rem] text-slate-400">حالا می‌توانید گفت‌وگو کنید</span>
            </span>
          </div>
        </section>

        {/* ---------- نوار اعتماد ---------- */}
        <section className="nv-card-glass mb-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-4 text-xs font-bold text-slate-500">
          {NOT_INCLUDED.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <IconCheck size={14} className="text-emerald-500" />
              {t(item)}
            </span>
          ))}
        </section>

        {/* ---------- ویژگی‌ها (سبک و بدون کارت سنگین) ---------- */}
        <section className="mb-16 grid gap-8 sm:grid-cols-3">
          {FEATURES.map(({ title, body, Icon }) => (
            <article key={title} className="text-center sm:text-right">
              <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-grad text-white shadow-glow sm:mx-0">
                <Icon size={21} />
              </span>
              <h3 className="mb-2 text-base font-extrabold text-ink">{t(title)}</h3>
              <p className="text-sm leading-7 text-slate-500">{t(body)}</p>
            </article>
          ))}
        </section>

        {/* ---------- مراحل: خط زمانی فشرده ---------- */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">
              {t('در چهار قدم شروع کنید')}
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">{t('کل مسیر کمتر از دو دقیقه طول می‌کشد.')}</p>
          </div>

          <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <span
              aria-hidden
              className="absolute inset-x-10 top-5 hidden h-px bg-gradient-to-l from-transparent via-brand-200 to-transparent lg:block"
            />
            {STEPS.map(({ n, title, body }) => (
              <li key={n} className="relative text-center lg:text-right">
                <span className="relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-grad text-sm font-extrabold text-white shadow-glow lg:mx-0">
                  {n}
                </span>
                <h3 className="mb-1.5 mt-4 text-sm font-extrabold text-ink">{t(title)}</h3>
                <p className="text-xs leading-6 text-slate-500">{t(body)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- امنیت ---------- */}
        <section className="nv-card mb-16 grid gap-8 p-7 sm:p-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <IconShield size={22} />
            </span>
            <h2 className="mb-2.5 mt-4 text-xl font-extrabold text-ink">{t('امنیت و حریم خصوصی')}</h2>
            <p className="text-sm leading-7 text-slate-500">
              {t('این یک نسخه آزمایشی است')} — {t('هاوڕێ صرفاً برای نمایش و آزمایش ساخته شده و داده‌های آن ساختگی‌اند.')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
              <Link href="/terms" className="text-brand-700 underline underline-offset-4 hover:text-brand-600">
                {t('قوانین استفاده')}
              </Link>
              <Link href="/privacy" className="text-brand-700 underline underline-offset-4 hover:text-brand-600">
                {t('حریم خصوصی')}
              </Link>
            </div>
          </div>

          <ul className="space-y-3">
            {PRIVACY.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-7 text-slate-600">
                <IconCheck size={17} className="mt-1.5 shrink-0 text-emerald-500" />
                {t(item)}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- فراخوان پایانی ---------- */}
        <section className="mb-14 overflow-hidden rounded-[2rem] bg-brand-grad px-6 py-12 text-center text-white shadow-glow sm:px-10">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{t('آماده‌اید شروع کنید؟')}</h2>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-7 text-white/90">
            {t('ساخت حساب رایگان است و کمتر از یک دقیقه طول می‌کشد.')}
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex rounded-2xl bg-white px-8 py-3.5 text-base font-extrabold text-brand-700 shadow-lift transition hover:-translate-y-0.5"
          >
            {t('ساخت حساب رایگان')}
          </Link>
        </section>
      </main>

      {/* ---------- پاورقی ---------- */}
      <footer className="relative z-10 border-t border-white/60 py-7">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span className="inline-flex flex-col items-center gap-1 sm:items-start">
            <span className="inline-flex items-center gap-2">
              <Logo size="sm" withText={false} />
              هاوڕێ — پروژه آزمایشی آشنایی آنلاین
            </span>
            <span className="text-2xs font-bold text-slate-400">ساخته شده توسط عبدالمتین پرچین</span>
            <span className="mt-1 sm:hidden">
              <LanguageQuickSwitcher />
            </span>
          </span>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-bold">
            <Link href="/terms" className="transition hover:text-brand-600">
              {t('قوانین استفاده')}
            </Link>
            <Link href="/privacy" className="transition hover:text-brand-600">
              {t('حریم خصوصی')}
            </Link>
            <Link href="/report" className="transition hover:text-brand-600">
              {t('گزارش و پشتیبانی')}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
