'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import { Alert } from '@/components/ui';
import { api } from '@/lib/client';

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('در حال بررسی لینک تأیید…');

  useEffect(() => {
    (async () => {
      if (!token) {
        setState('error');
        return setMessage('لینک تأیید نامعتبر است.');
      }
      const res = await api<{ message: string }>('/api/auth/verify-email', { method: 'POST', json: { token } });
      if (res.ok) {
        setState('ok');
        setMessage(res.data.message);
      } else {
        setState('error');
        setMessage(res.error);
      }
    })();
  }, [token]);

  return (
    <AuthLayout title="تأیید ایمیل">
      {state === 'loading' ? (
        <p className="text-sm text-slate-500">{message}</p>
      ) : (
        <Alert kind={state === 'ok' ? 'success' : 'error'}>{message}</Alert>
      )}
      <div className="mt-6 flex gap-2">
        <Link href="/discover" className="nv-btn-primary flex-1">رفتن به برنامه</Link>
        <Link href="/login" className="nv-btn-secondary flex-1">ورود</Link>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">در حال بارگذاری…</div>}>
      <Verify />
    </Suspense>
  );
}
