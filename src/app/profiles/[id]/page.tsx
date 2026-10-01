'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import VerifiedBadge from '@/components/VerifiedBadge';
import ProfileActions from '@/components/ProfileActions';
import { Alert, Spinner } from '@/components/ui';
import { api, toFa } from '@/lib/client';
import { GENDER_LABELS } from '@/lib/constants';

type PublicProfile = {
  userId: string;
  displayName: string;
  isVerified?: boolean;
  age: number;
  gender: string;
  city: string;
  bio: string;
  interests: string[];
  photos: { id: string; url: string }[];
  distanceKm: number | null;
};

export default function ProfileDetailPage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api<{ profile: PublicProfile }>(`/api/profiles/${params.id}`);
      if (!res.ok) return setError(res.error);
      setProfile(res.data.profile);
    })();
  }, [params.id]);

  return (
    <AppFrame>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/discover" className="nv-btn-ghost text-sm">
          → بازگشت به کاوش
        </Link>

        {error ? (
          <Alert kind="error">{error}</Alert>
        ) : !profile ? (
          <div className="nv-card flex justify-center p-12">
            <Spinner className="border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <div className="nv-card overflow-hidden p-0">
            <div className="grid gap-1 bg-slate-100 sm:grid-cols-2">
              {profile.photos.length === 0 && (
                <div className="flex h-72 items-center justify-center bg-gradient-to-br from-brand-500 to-coral-400 text-6xl font-extrabold text-white/80 sm:col-span-2">
                  {profile.displayName.slice(0, 1)}
                </div>
              )}
              {profile.photos.map((p, i) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={`عکس ${i + 1} از ${profile.displayName}`}
                  className={`h-72 w-full object-cover ${i === 0 && profile.photos.length > 1 ? 'sm:col-span-2' : ''}`}
                />
              ))}
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
                    {profile.displayName}
                    {profile.isVerified && <VerifiedBadge size={20} />}
                  </h1>
                  <span className="text-base font-bold text-slate-500">{toFa(profile.age)} ساله</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {profile.city}
                  {profile.distanceKm !== null && ` • حدود ${toFa(profile.distanceKm)} کیلومتر`}
                </p>
              </div>

              {profile.bio && (
                <section>
                  <h2 className="mb-2 text-sm font-extrabold text-slate-700">درباره من</h2>
                  <p className="whitespace-pre-line text-sm leading-8 text-slate-600">{profile.bio}</p>
                </section>
              )}

              {profile.interests.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-extrabold text-slate-700">علاقه‌مندی‌ها</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((i) => (
                      <span key={i} className="nv-chip">
                        {i}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-2 text-sm font-extrabold text-slate-700">اطلاعات عمومی</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-400">جنسیت</dt>
                    <dd className="font-bold text-slate-700">{GENDER_LABELS[profile.gender]}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-400">شهر</dt>
                    <dd className="font-bold text-slate-700">{profile.city}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-slate-400">
                  اطلاعات خصوصی مانند ایمیل و مکان دقیق هرگز نمایش داده نمی‌شود.
                </p>
              </section>

              <ProfileActions userId={profile.userId} displayName={profile.displayName} />
            </div>
          </div>
        )}
      </div>
    </AppFrame>
  );
}
