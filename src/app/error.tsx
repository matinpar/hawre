'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui';
import { IconWarn, IconUndo } from '@/components/Icons';

/**
 * صفحه خطای سراسری — پیام دوستانه به‌جای صفحه سفید،
 * بدون افشای جزئیات فنی به کاربر (جزئیات فقط در کنسول سرور/مرورگر).
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[hawre] خطای بخش کاربری:', error);
  }, [error]);

  return (
    <main className="nv-bg flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Link href="/" className="mb-9">
        <Logo size="lg" />
      </Link>

      <div className="nv-card w-full max-w-md p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
          <IconWarn size={26} />
        </div>
        <h1 className="text-xl font-extrabold text-ink">مشکلی پیش آمد</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          این صفحه به‌درستی بارگذاری نشد. لطفاً یک بار دیگر تلاش کنید؛ اگر باز هم تکرار شد، از صفحه
          «گزارش و پشتیبانی» به ما اطلاع دهید.
        </p>
        {error.digest && <p className="mt-2 text-2xs text-slate-400">کد پیگیری: {error.digest}</p>}

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button onClick={reset} className="nv-btn nv-btn-primary flex-1">
            <IconUndo size={17} />
            تلاش دوباره
          </button>
          <Link href="/" className="nv-btn nv-btn-secondary flex-1">
            بازگشت به صفحه نخست
          </Link>
        </div>
      </div>
    </main>
  );
}
