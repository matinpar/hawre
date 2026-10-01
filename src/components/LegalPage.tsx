import Link from 'next/link';
import { Logo } from './ui';

export default function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/"><Logo /></Link>
        <Link href="/" className="nv-btn-ghost text-sm">بازگشت</Link>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-16">
        <div className="nv-card p-6 sm:p-9">
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-2 text-xs text-slate-400">آخرین به‌روزرسانی: نسخه آزمایشی</p>
          <div className="mt-7 space-y-6">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-2 text-base font-extrabold text-brand-700">{s.title}</h2>
                <p className="text-sm leading-8 text-slate-600">{s.body}</p>
              </section>
            ))}
          </div>

          <div className="nv-divider my-8" />
          <p className="text-center text-xs font-bold text-slate-400">
            هاوڕێ — ساخته شده توسط عبدالمتین پرچین
          </p>
        </div>
      </main>
    </div>
  );
}
