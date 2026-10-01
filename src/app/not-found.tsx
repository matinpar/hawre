import Link from 'next/link';
import { Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-4 text-center">
      <Logo size="lg" />
      <h1 className="text-2xl font-extrabold text-ink">صفحه‌ای که دنبالش بودید پیدا نشد</h1>
      <p className="max-w-sm text-sm leading-7 text-slate-500">
        ممکن است این محتوا حذف شده باشد یا دسترسی به آن برای شما مجاز نباشد.
      </p>
      <Link href="/" className="nv-btn-primary">بازگشت به صفحه نخست</Link>
    </div>
  );
}
