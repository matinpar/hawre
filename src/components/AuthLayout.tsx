import Link from 'next/link';
import { Logo } from './ui';
import { IconGoogle, IconHeartFilled, IconShield, IconSparkle } from './Icons';

const HIGHLIGHTS = [
  { Icon: IconShield, text: 'رمز عبور هش‌شده؛ ایمیل شما هرگز به دیگران نشان داده نمی‌شود.' },
  { Icon: IconHeartFilled, text: 'گفت‌وگو فقط پس از علاقه دوطرفه آغاز می‌شود.' },
  { Icon: IconSparkle, text: 'بدون پرداخت، بدون اشتراک و بدون تبلیغات.' },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nv-bg flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-5">
        <Link href="/" aria-label="بازگشت به صفحه نخست" className="inline-block">
          <Logo />
        </Link>
      </header>

      <main
        id="main"
        className="mx-auto grid w-full max-w-5xl flex-1 items-start gap-10 px-4 pb-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center"
      >
        {/* پنل معرفی — فقط دسکتاپ */}
        <section className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-grad p-9 text-white shadow-lift">
            <span
              aria-hidden
              className="absolute -left-16 -top-16 h-56 w-56 animate-drift rounded-full bg-white/20 blur-2xl"
            />
            <span
              aria-hidden
              className="absolute -bottom-20 -right-10 h-64 w-64 animate-drift rounded-full bg-coral-300/30 blur-3xl"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <IconSparkle size={14} /> رایگان، بدون تبلیغات
              </span>
              <h2 className="mt-5 text-3xl font-extrabold leading-[1.5]">
                آشنایی تازه،
                <br /> ساده و بی‌دردسر
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-8 text-white/85">
                پروفایل بسازید، افراد هم‌سلیقه را ببینید و اگر علاقه دوطرفه بود گفت‌وگو را شروع کنید.
              </p>
              <ul className="mt-7 space-y-3.5">
                {HIGHLIGHTS.map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-7 text-white/90">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                      <Icon size={16} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* کارت فرم */}
        <section className="mx-auto w-full max-w-md">
          <div className="nv-card relative animate-floatUp overflow-hidden p-7 shadow-card sm:p-8">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-grad" />
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-5 text-center text-xs leading-6 text-slate-400">
            با ادامه، <Link href="/terms" className="font-bold text-brand-600 underline underline-offset-4">قوانین استفاده</Link>{' '}
            و <Link href="/privacy" className="font-bold text-brand-600 underline underline-offset-4">حریم خصوصی</Link> را می‌پذیرید.
          </p>
        </section>
      </main>
    </div>
  );
}

export function GoogleButton({ label = 'ورود با Google' }: { label?: string }) {
  return (
    <a href="/api/auth/google" className="nv-btn-secondary w-full">
      <IconGoogle size={18} />
      {label}
    </a>
  );
}

export function Divider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400">
      <span className="nv-divider flex-1" />
      یا
      <span className="nv-divider flex-1" />
    </div>
  );
}
