'use client';

import { useEffect, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import ProfileForm, { type ProfileFormValues } from '@/components/ProfileForm';
import type { Photo } from '@/components/PhotoManager';
import { Alert, PageHeader, Spinner } from '@/components/ui';
import { IconUser } from '@/components/Icons';
import { api } from '@/lib/client';
import VerificationCard from '@/components/VerificationCard';

type ProfileResponse = {
  profile: (ProfileFormValues & { profileCompleted: boolean }) | null;
  photos: Photo[];
};

export default function EditProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api<ProfileResponse>('/api/profile/me');
      if (!res.ok) return setError(res.error);
      setData(res.data);
    })();
  }, []);

  return (
    <AppFrame>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="ویرایش پروفایل"
          subtitle="تغییرات بلافاصله پس از ذخیره روی پروفایل شما اعمال می‌شود."
          icon={<IconUser size={22} />}
        />
        <div className="nv-card p-6 sm:p-8">
          {error ? (
            <Alert kind="error">{error}</Alert>
          ) : !data ? (
            <div className="flex justify-center py-10">
              <Spinner className="border-brand-200 border-t-brand-600" />
            </div>
          ) : (
            <ProfileForm
              mode="edit"
              photos={data.photos}
              initial={data.profile ? { ...data.profile } : undefined}
            />
          )}
        </div>

        {data?.profile?.profileCompleted && (
          <div className="mt-5">
            <VerificationCard />
          </div>
        )}
      </div>
    </AppFrame>
  );
}
