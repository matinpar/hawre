'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/client';
import { Alert, Spinner } from './ui';
import { ALLOWED_IMAGE_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES } from '@/lib/constants';

export type Photo = { id: string; url: string; isPrimary: boolean };

export default function PhotoManager({
  initialPhotos,
  onChange,
}: {
  initialPhotos: Photo[];
  onChange?: (photos: Photo[]) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: Photo[]) {
    setPhotos(next);
    onChange?.(next);
  }

  async function upload(file: File) {
    setError('');
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return setError('فقط فایل‌های JPG، PNG و WebP مجاز هستند.');
    if (file.size > MAX_PHOTO_BYTES) return setError('حجم تصویر نباید بیشتر از ۳ مگابایت باشد.');
    if (photos.length >= MAX_PHOTOS) return setError(`حداکثر ${MAX_PHOTOS} عکس می‌توانید داشته باشید.`);

    const body = new FormData();
    body.append('file', file);
    setBusy(true);
    const res = await api<{ photo: Photo }>('/api/profile/photos', { method: 'POST', body });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    update([...photos, res.data.photo]);
  }

  async function remove(id: string) {
    setError('');
    setBusy(true);
    const res = await api('/api/profile/photos/' + id, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    const next = photos.filter((p) => p.id !== id);
    if (next.length && !next.some((p) => p.isPrimary)) next[0].isPrimary = true;
    update(next);
  }

  async function makePrimary(id: string) {
    setError('');
    setBusy(true);
    const res = await api('/api/profile/photos/' + id, { method: 'PATCH' });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    update(photos.map((p) => ({ ...p, isPrimary: p.id === id })));
  }

  return (
    <div>
      <span className="nv-label">عکس‌های پروفایل</span>
      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <figure key={p.id} className="group relative overflow-hidden rounded-2xl border border-slate-200">
            <img src={p.url} alt="عکس پروفایل" className="h-28 w-full object-cover" />
            {p.isPrimary && (
              <figcaption className="absolute right-1 top-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                اصلی
              </figcaption>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/45 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => makePrimary(p.id)}
                disabled={p.isPrimary || busy}
                className="rounded-lg px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20 disabled:opacity-40"
              >
                اصلی
              </button>
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={busy}
                className="rounded-lg px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
              >
                حذف
              </button>
            </div>
          </figure>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-xs font-bold text-brand-600 transition hover:bg-brand-50"
          >
            {busy ? <Spinner className="border-brand-200 border-t-brand-600" /> : <span className="text-2xl">＋</span>}
            افزودن عکس
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="انتخاب عکس پروفایل"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      <p className="mt-2 text-xs text-slate-500">
        حداکثر {MAX_PHOTOS} عکس، هر کدام تا ۳ مگابایت. فرمت‌های مجاز: JPG، PNG و WebP.
      </p>
    </div>
  );
}
