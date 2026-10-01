'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client';
import { Alert, Spinner } from './ui';
import PhotoManager, { type Photo } from './PhotoManager';
import { CITIES, GENDERS, GENDER_LABELS, INTEREST_SUGGESTIONS, PREFERRED_GENDERS } from '@/lib/constants';

export type ProfileFormValues = {
  displayName: string;
  birthDate: string;
  gender: string;
  preferredGender: string;
  city: string;
  bio: string;
  interests: string[];
  ageMin: number;
  ageMax: number;
  maxDistance: number;
};

const EMPTY: ProfileFormValues = {
  displayName: '',
  birthDate: '',
  gender: '',
  preferredGender: 'ANY',
  city: '',
  bio: '',
  interests: [],
  ageMin: 18,
  ageMax: 45,
  maxDistance: 50,
};

export default function ProfileForm({
  initial,
  photos,
  mode,
}: {
  initial?: Partial<ProfileFormValues>;
  photos: Photo[];
  mode: 'onboarding' | 'edit';
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>({ ...EMPTY, ...initial });
  const [photoList, setPhotoList] = useState<Photo[]>(photos);
  const [interestInput, setInterestInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function addInterest(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (values.interests.includes(value)) return;
    if (values.interests.length >= 10) return setError('حداکثر ۱۰ علاقه‌مندی مجاز است.');
    set('interests', [...values.interests, value]);
    setInterestInput('');
  }

  function validate(): string {
    if (values.displayName.trim().length < 2) return 'نام نمایشی باید حداقل ۲ کاراکتر باشد.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.birthDate)) return 'تاریخ تولد را وارد کنید.';
    const age = calcAge(values.birthDate);
    if (age < 18) return 'برای استفاده از این سرویس باید حداقل ۱۸ سال داشته باشید.';
    if (age > 100) return 'تاریخ تولد معتبر نیست.';
    if (!values.gender) return 'جنسیت را انتخاب کنید.';
    if (!values.city.trim()) return 'شهر را وارد کنید.';
    if (values.bio.length > 500) return 'معرفی نباید بیش از ۵۰۰ کاراکتر باشد.';
    if (values.ageMin > values.ageMax) return 'حداقل سن نمی‌تواند از حداکثر سن بیشتر باشد.';
    if (mode === 'onboarding' && photoList.length === 0) return 'حداقل یک عکس پروفایل اضافه کنید.';
    return '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    const localError = validate();
    if (localError) return setError(localError);

    setLoading(true);
    const res = await api<{ needsPhoto?: boolean }>('/api/profile/me', {
      method: mode === 'onboarding' ? 'PUT' : 'PATCH',
      json: values,
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);

    if (mode === 'onboarding') {
      router.push('/discover');
      router.refresh();
    } else {
      setSuccess('تغییرات با موفقیت ذخیره شد.');
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="displayName" className="nv-label">نام نمایشی</label>
          <input
            id="displayName"
            className="nv-input"
            maxLength={40}
            required
            value={values.displayName}
            onChange={(e) => set('displayName', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="birthDate" className="nv-label">تاریخ تولد (میلادی)</label>
          <input
            id="birthDate"
            type="date"
            dir="ltr"
            className="nv-input"
            required
            value={values.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
          />
          {values.birthDate && /^\d{4}-\d{2}-\d{2}$/.test(values.birthDate) && (
            <p className="mt-2 text-xs text-slate-500">سن شما: {calcAge(values.birthDate)} سال</p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="nv-label">جنسیت</label>
          <select id="gender" className="nv-input" required value={values.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">انتخاب کنید</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="preferredGender" className="nv-label">مایلم پروفایل چه کسانی را ببینم</label>
          <select
            id="preferredGender"
            className="nv-input"
            value={values.preferredGender}
            onChange={(e) => set('preferredGender', e.target.value)}
          >
            {PREFERRED_GENDERS.map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="city" className="nv-label">شهر یا منطقه</label>
          <input
            id="city"
            list="city-list"
            className="nv-input"
            required
            value={values.city}
            onChange={(e) => set('city', e.target.value)}
          />
          <datalist id="city-list">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <p className="mt-2 text-xs text-slate-500">مکان دقیق شما ذخیره یا نمایش داده نمی‌شود.</p>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="nv-label">معرفی کوتاه</label>
        <textarea
          id="bio"
          rows={4}
          maxLength={500}
          className="nv-input resize-none"
          placeholder="چند جمله درباره خودتان بنویسید…"
          value={values.bio}
          onChange={(e) => set('bio', e.target.value)}
        />
        <p className="mt-1 text-left text-xs text-slate-400">{values.bio.length} / ۵۰۰</p>
      </div>

      <div>
        <label htmlFor="interest" className="nv-label">علاقه‌مندی‌ها</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {values.interests.map((i) => (
            <span key={i} className="nv-chip">
              {i}
              <button
                type="button"
                aria-label={`حذف ${i}`}
                className="mr-1 text-brand-500 hover:text-coral-500"
                onClick={() => set('interests', values.interests.filter((x) => x !== i))}
              >
                ✕
              </button>
            </span>
          ))}
          {values.interests.length === 0 && <span className="text-xs text-slate-400">هنوز چیزی اضافه نکرده‌اید.</span>}
        </div>
        <div className="flex gap-2">
          <input
            id="interest"
            className="nv-input"
            placeholder="مثلاً: کتاب"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterest(interestInput);
              }
            }}
          />
          <button type="button" className="nv-btn-secondary shrink-0" onClick={() => addInterest(interestInput)}>
            افزودن
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_SUGGESTIONS.filter((s) => !values.interests.includes(s)).slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addInterest(s)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="ageMin" className="nv-label">حداقل سن موردنظر</label>
          <input
            id="ageMin"
            type="number"
            min={18}
            max={100}
            className="nv-input"
            value={values.ageMin}
            onChange={(e) => set('ageMin', Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="ageMax" className="nv-label">حداکثر سن موردنظر</label>
          <input
            id="ageMax"
            type="number"
            min={18}
            max={100}
            className="nv-input"
            value={values.ageMax}
            onChange={(e) => set('ageMax', Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="maxDistance" className="nv-label">حداکثر فاصله (کیلومتر)</label>
          <input
            id="maxDistance"
            type="number"
            min={1}
            max={500}
            className="nv-input"
            value={values.maxDistance}
            onChange={(e) => set('maxDistance', Number(e.target.value))}
          />
        </div>
      </div>

      <PhotoManager initialPhotos={photoList} onChange={setPhotoList} />

      <button type="submit" disabled={loading} className="nv-btn-primary w-full sm:w-auto sm:px-10">
        {loading ? <Spinner /> : mode === 'onboarding' ? 'ادامه' : 'ذخیره تغییرات'}
      </button>
    </form>
  );
}

function calcAge(date: string) {
  const d = new Date(date);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
