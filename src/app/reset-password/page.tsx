'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import { Alert, Spinner } from '@/components/ui';
import { api } from '@/lib/client';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!token) return setError('لینک بازیابی نامعتبر است.');
    if (form.password.length < 8) return setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
    if (form.password !== form.confirmPassword) return setError('رمز عبور و تکرار آن یکسان نیستند.');

    setLoading(true);
    const res = await api<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      json: { token, ...form },
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setMessage(res.data.message);
    setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <AuthLayout title="تعیین رمز عبور جدید">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {error && <Alert kind="error">{error}</Alert>}
        {message && <Alert kind="success">{message}</Alert>}
        <div>
          <label htmlFor="password" className="nv-label">رمز عبور جدید</label>
          <input id="password" type="password" dir="ltr" className="nv-input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="nv-label">تکرار رمز عبور جدید</label>
          <input id="confirmPassword" type="password" dir="ltr" className="nv-input" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="nv-btn-primary w-full">
          {loading ? <Spinner /> : 'ذخیره رمز جدید'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-bold text-brand-700 underline underline-offset-4">بازگشت به ورود</Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">در حال بارگذاری…</div>}>
      <ResetForm />
    </Suspense>
  );
}
