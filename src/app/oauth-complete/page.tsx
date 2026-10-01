'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import { Alert, Spinner } from '@/components/ui';
import { api, setToken } from '@/lib/client';

function Complete() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const next = params.get('next') ?? '/discover';
    (async () => {
      if (!code) return setError('کد ورود یافت نشد. دوباره تلاش کنید.');
      const res = await api<{ profileCompleted: boolean; sessionToken?: string }>('/api/auth/oauth-exchange', {
        method: 'POST',
        json: { code },
      });
      if (!res.ok) return setError(res.error);
      setToken(res.data.sessionToken);
      router.replace(res.data.profileCompleted ? next : '/onboarding');
    })();
  }, [params, router]);

  return (
    <AuthLayout title="در حال تکمیل ورود با Google">
      {error ? (
        <Alert kind="error">{error}</Alert>
      ) : (
        <p className="flex items-center gap-3 text-sm text-slate-500">
          <Spinner className="border-brand-200 border-t-brand-600" />
          لطفاً چند لحظه صبر کنید…
        </p>
      )}
    </AuthLayout>
  );
}

export default function OAuthCompletePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">در حال بارگذاری…</div>}>
      <Complete />
    </Suspense>
  );
}
