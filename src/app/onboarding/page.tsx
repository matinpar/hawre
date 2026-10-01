'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileForm, { type ProfileFormValues } from '@/components/ProfileForm';
import type { Photo } from '@/components/PhotoManager';
import { Alert, Logo, Spinner } from '@/components/ui';
import { api } from '@/lib/client';

type ProfileResponse = {
  profile: (ProfileFormValues & { profileCompleted: boolean }) | null;
  photos: Photo[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const me = await api<{ user: { profileCompleted: boolean } | null }>('/api/auth/me');
      if (!me.ok || !me.data.user) return router.replace('/login');
      if (me.data.user.profileCompleted) return router.replace('/discover');

      const res = await api<ProfileResponse>('/api/profile/me');
      if (!res.ok) return setError(res.error);
      setData(res.data);
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f1eefb]">
      <header className="mx-auto w-full max-w-3xl px-4 py-5">
        <Logo />
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-16">
        <div className="nv-card p-6 sm:p-8">
          <h1 className="text-xl font-extrabold text-ink">پروفایل خود را تکمیل کنید</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            این اطلاعات برای پیدا کردن افراد هم‌سلیقه استفاده می‌شود. ایمیل شما هرگز به دیگران نمایش داده نمی‌شود.
          </p>
          <div className="mt-7">
            {error ? (
              <Alert kind="error">{error}</Alert>
            ) : !data ? (
              <div className="flex justify-center py-10">
                <Spinner className="border-brand-200 border-t-brand-600" />
              </div>
            ) : (
              <ProfileForm
                mode="onboarding"
                photos={data.photos}
                initial={data.profile ? { ...data.profile } : undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
