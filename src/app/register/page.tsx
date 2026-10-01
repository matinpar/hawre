'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthLayout, { Divider, GoogleButton } from '@/components/AuthLayout';
import { Alert, Spinner } from '@/components/ui';
import { api, setToken } from '@/lib/client';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  function localValidate() {
    if (!form.email.trim()) return 'ایمیل الزامی است.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'قالب ایمیل معتبر نیست.';
    if (form.password.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      return 'رمز عبور باید شامل حروف و عدد باشد.';
    if (form.password !== form.confirmPassword) return 'رمز عبور و تکرار آن یکسان نیستند.';
    if (!form.acceptTerms) return 'پذیرش قوانین و حریم خصوصی الزامی است.';
    return '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setNotice('');
    const localError = localValidate();
    if (localError) return setError(localError);

    setLoading(true);
    const res = await api<{ message: string; devVerifyUrl?: string; sessionToken?: string }>('/api/auth/register', {
      method: 'POST',
      json: form,
    });
    setLoading(false);

    if (!res.ok) return setError(res.error);
    setToken(res.data.sessionToken);
    if (res.data.devVerifyUrl) {
      setNotice(`حساب ساخته شد. برای تأیید ایمیل در محیط توسعه از این لینک استفاده کنید: ${res.data.devVerifyUrl}`);
      setTimeout(() => router.push('/onboarding'), 2500);
    } else {
      router.push('/onboarding');
    }
    router.refresh();
  }

  return (
    <AuthLayout title="ساخت حساب کاربری" subtitle="رایگان است و کمتر از یک دقیقه طول می‌کشد.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}

        <div>
          <label htmlFor="email" className="nv-label">
            {t('ایمیل')}
          </label>
          <input
            id="email"
            name="email"
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
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-help"
            className="nv-input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <p id="password-help" className="mt-2 text-xs text-slate-500">
            حداقل ۸ کاراکتر، شامل حروف و عدد.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="nv-label">
            {t('تکرار رمز عبور')}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            required
            className="nv-input"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
            checked={form.acceptTerms}
            onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
          />
          <span>
            <Link href="/terms" className="font-bold text-brand-700 underline underline-offset-4">
              {t('قوانین استفاده')}
            </Link>{' '}
            و{' '}
            <Link href="/privacy" className="font-bold text-brand-700 underline underline-offset-4">
              {t('حریم خصوصی')}
            </Link>{' '}
            را می‌پذیرم و بیش از ۱۸ سال دارم.
          </span>
        </label>

        <button type="submit" disabled={loading} className="nv-btn-primary w-full">
          {loading ? <Spinner /> : 'ثبت‌نام'}
        </button>
      </form>

      <Divider />
      <GoogleButton label="ثبت‌نام با Google" />

      <p className="mt-6 text-center text-sm text-slate-500">
        حساب دارید؟{' '}
        <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">
          وارد شوید
        </Link>
      </p>
    </AuthLayout>
  );
}
