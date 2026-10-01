'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { Spinner } from './ui';
import { api, tokenIsMemoryOnly } from '@/lib/client';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  authProvider: string;
  profileCompleted: boolean;
  displayName: string | null;
  photo: string | null;
};

/**
 * پوسته صفحات محافظت‌شده.
 * نشست را سمت کلاینت می‌خواند (کوکی یا توکن جایگزین) تا در محیط‌هایی که مرورگر
 * کوکی شخص‌ثالث را مسدود می‌کند هم برنامه کار کند. کنترل واقعی دسترسی همچنان
 * در سمت سرور و روی تک‌تک APIها انجام می‌شود.
 */
export default function AppFrame({
  children,
  requireProfile = true,
  requireAdmin = false,
}: {
  children: React.ReactNode | ((user: SessionUser) => React.ReactNode);
  requireProfile?: boolean;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState<'loading' | 'ready'>('loading');
  const [memoryOnly, setMemoryOnly] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await api<{ user: SessionUser | null }>('/api/auth/me');
      if (!active) return;
      const me = res.ok ? res.data.user : null;
      if (!me) {
        router.replace('/login');
        return;
      }
      if (requireProfile && !me.profileCompleted) {
        router.replace('/onboarding');
        return;
      }
      if (requireAdmin && me.role !== 'ADMIN') {
        router.replace('/discover');
        return;
      }
      setUser(me);
      setMemoryOnly(tokenIsMemoryOnly());
      setState('ready');
    })();
    return () => {
      active = false;
    };
  }, [router, requireProfile, requireAdmin]);

  if (state === 'loading' || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <span className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <Spinner className="border-brand-200 border-t-brand-600" />
          در حال بارگذاری…
        </span>
      </div>
    );
  }

  return (
    <AppShell
      user={{ displayName: user.displayName, photo: user.photo, isAdmin: user.role === 'ADMIN' }}
    >
      {memoryOnly && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
          مرورگر شما ذخیره‌سازی محلی را در این نمایش مسدود کرده است؛ بنابراین نشست شما فقط تا زمان باز بودن همین صفحه
          معتبر است و با تازه‌سازی صفحه باید دوباره وارد شوید.
        </p>
      )}
      {typeof children === 'function' ? children(user) : children}
    </AppShell>
  );
}
