'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthLayout, { Divider, GoogleButton } from '@/components/AuthLayout';
import { Alert, Spinner } from '@/components/ui';
import { api, setToken } from '@/lib/client';
import { useT } from '@/lib/i18n';

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [error, setError] = useState(params.get('error') ?? '');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!form.email.trim()) return setError('ایمیل الزامی است.');
    if (!form.password) return setError('رمز عبور الزامی است.');

    setLoading(true);
    const res = await api<{ profileCompleted: boolean; sessionToken?: string }>('/api/auth/login', {
      method: 'POST',
      json: form,
    });
    if (!res.ok) {
      setLoading(false);
      return setError(res.error);
    }
    // اگر مرورگر کوکی را نپذیرد (مثلاً داخل iframe)، از توکن جایگزین استفاده می‌کنیم
    setToken(res.data.sessionToken);

    // بررسی می‌کنیم کوکی نشست واقعاً در مرورگر ذخیره شده باشد
    // (در برخی مرورگرها کوکی داخل iframe مسدود می‌شود و ورود بی‌صدا شکست می‌خورد)
    const session = await api<{ user: { id: string } | null }>('/api/auth/me');
    setLoading(false);
    if (!session.ok || !session.data.user) {
      return setError(
        'ورود انجام شد اما مرورگر اجازه نگه‌داری نشست را نداد. لطفاً این صفحه را در یک تب مستقل باز کنید یا از مرورگر دیگری استفاده کنید.',
      );
    }

    router.push(res.data.profileCompleted ? '/discover' : '/onboarding');
    router.refresh();
  }

  return (
    <AuthLayout title="ورود به هاوڕێ" subtitle="با ایمیل و رمز عبور یا حساب Google وارد شوید.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {params.get('registered') && <Alert kind="success">ثبت‌نام انجام شد. اکنون وارد شوید.</Alert>}

        <div>
          <label htmlFor="email" className="nv-label">
            {t('ایمیل')}
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            className="nv-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="password" className="nv-label">
            {t('رمز عبور')}
          </label>
          <input
            id="password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            className="nv-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
            />
            {t('مرا به خاطر بسپار')}
          </label>
          <Link href="/forgot-password" className="text-sm font-bold text-brand-700 underline underline-offset-4">
            {t('رمز عبور را فراموش کرده‌اید؟')}
          </Link>
        </div>

        <button type="submit" disabled={loading} className="nv-btn-primary w-full">
          {loading ? <Spinner /> : 'ورود'}
        </button>
      </form>

      <Divider />
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-slate-500">
        هنوز حساب ندارید؟{' '}
        <Link href="/register" className="font-bold text-brand-700 underline underline-offset-4">
          ثبت‌نام کنید
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">در حال بارگذاری…</div>}>
      <LoginForm />
    </Suspense>
  );
}
