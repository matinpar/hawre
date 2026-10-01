'use client';

import Link from 'next/link';
import { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import { Alert, Spinner } from '@/components/ui';
import { api } from '@/lib/client';
import { useT } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setMessage('');
    setDevUrl('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('قالب ایمیل معتبر نیست.');

    setLoading(true);
    const res = await api<{ message: string; devResetUrl?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      json: { email },
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setMessage(res.data.message);
    if (res.data.devResetUrl) setDevUrl(res.data.devResetUrl);
  }

  return (
    <AuthLayout title={t('بازیابی رمز عبور')} subtitle="ایمیل حساب خود را وارد کنید تا لینک بازیابی ارسال شود.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {message && <Alert kind="success">{message}</Alert>}
        {devUrl && (
          <div className="rounded-2xl bg-brand-50 p-3 text-xs leading-6 text-brand-800">
            <span className="font-bold">لینک محیط توسعه:</span>{' '}
            <Link href={devUrl.replace(/^https?:\/\/[^/]+/, '')} className="break-all underline">
              {devUrl}
            </Link>
          </div>
        )}

        <div>
          <label htmlFor="email" className="nv-label">{t('ایمیل')}</label>
          <input
            id="email"
            type="email"
            dir="ltr"
            required
            className="nv-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="nv-btn-primary w-full">
          {loading ? <Spinner /> : 'ارسال لینک بازیابی'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">بازگشت به ورود</Link>
      </p>
    </AuthLayout>
  );
}
