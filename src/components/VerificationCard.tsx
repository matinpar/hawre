'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/client';
import { Alert, Spinner } from './ui';
import { IconIdCard, IconCamera, IconCheck, IconClose } from './Icons';
import VerifiedBadge from './VerifiedBadge';
import { useT } from '@/lib/i18n';

type State = {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  gesture: string;
  note: string;
  isVerified: boolean;
};

/** بخش «تأیید هویت» در صفحه پروفایل: ارسال سلفی ژست‌دار و نمایش وضعیت */
export default function VerificationCard() {
  const t = useT();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await api<State>('/api/verification');
    if (res.ok) setState(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file: File) {
    setBusy(true);
    setMsg(null);
    const form = new FormData();
    form.append('file', file);
    const res = await api<{ message: string }>('/api/verification', { method: 'POST', body: form });
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.error });
    setMsg({ kind: 'success', text: res.data.message });
    load();
  }

  async function cancel() {
    setBusy(true);
    const res = await api<{ message: string }>('/api/verification', { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.error });
    setMsg({ kind: 'success', text: res.data.message });
    load();
  }

  if (!state) {
    return (
      <section className="nv-card flex justify-center p-8">
        <Spinner className="border-brand-200 border-t-brand-600" />
      </section>
    );
  }

  const verified = state.isVerified || state.status === 'APPROVED';

  return (
    <section className="nv-card p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <IconIdCard size={21} />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-ink">
            {t('تأیید هویت')}
            {verified && <VerifiedBadge size={17} />}
          </h2>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            با یک سلفیِ ساده، نشان «تأییدشده» کنار نام شما نمایش داده می‌شود و دیگران راحت‌تر اعتماد می‌کنند.
          </p>
        </div>
      </div>

      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      {verified ? (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <IconCheck size={17} />
          پروفایل شما تأیید شده است.
        </div>
      ) : state.status === 'PENDING' ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            درخواست شما در صف بررسی است. نتیجه از طریق ایمیل اطلاع داده می‌شود.
          </div>
          <button type="button" onClick={cancel} disabled={busy} className="nv-btn nv-btn-ghost text-xs">
            <IconClose size={15} />
            انصراف و حذف تصویر
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {state.status === 'REJECTED' && (
            <Alert kind="error">
              درخواست قبلی پذیرفته نشد{state.note ? `: ${state.note}` : '.'} می‌توانید دوباره تلاش کنید.
            </Alert>
          )}

          <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
            <p className="text-xs font-bold text-slate-500">ژست شما برای این تأیید:</p>
            <p className="mt-1.5 text-sm font-extrabold text-brand-700">{state.gesture}</p>
            <ul className="mt-3 space-y-1.5 text-2xs leading-6 text-slate-500">
              <li>• صورت شما کاملاً واضح و بدون فیلتر باشد.</li>
              <li>• نور کافی باشد و تصویر تار نباشد.</li>
              <li>• این عکس فقط برای بررسی مدیر است و در پروفایل شما نمایش داده نمی‌شود.</li>
              <li>• پس از بررسی، تصویر بلافاصله و برای همیشه حذف می‌شود.</li>
            </ul>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="nv-btn nv-btn-primary w-full"
          >
            {busy ? <Spinner /> : <IconCamera size={17} />}
            {t('ارسال سلفی برای تأیید')}
          </button>
        </div>
      )}
    </section>
  );
}
