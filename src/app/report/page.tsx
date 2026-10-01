'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Alert, Spinner } from '@/components/ui';
import { IconArrowRight, IconFlag } from '@/components/Icons';
import { api } from '@/lib/client';
import { REPORT_REASONS, REPORT_REASON_LABELS } from '@/lib/constants';

function ReportForm() {
  const params = useSearchParams();
  const [reportedUserId, setReportedUserId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReportedUserId(params.get('user') ?? '');
  }, [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');
    if (!reportedUserId.trim()) return setError('شناسه کاربر گزارش‌شونده مشخص نیست.');
    if (!reason) return setError('دلیل گزارش را انتخاب کنید.');

    setLoading(true);
    const res = await api<{ message: string }>('/api/reports', {
      method: 'POST',
      json: { reportedUserId, reason, description },
    });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setSuccess(res.data.message);
    setReason('');
    setDescription('');
  }

  return (
    <div className="nv-bg min-h-screen">
      <main id="main" className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/discover" className="nv-btn-ghost mb-4 gap-1.5 text-sm">
          <IconArrowRight size={16} />
          بازگشت
        </Link>
        <div className="nv-card relative overflow-hidden p-6 sm:p-8">
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-grad" />
          <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-grad text-white shadow-glow">
            <IconFlag size={22} />
          </span>
          <h1 className="text-xl font-extrabold text-ink">گزارش و پشتیبانی</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            اگر رفتار یا محتوایی را نامناسب می‌دانید به ما اطلاع دهید. گزارش‌ها محرمانه بررسی می‌شوند.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {error && <Alert kind="error">{error}</Alert>}
            {success && <Alert kind="success">{success}</Alert>}

            <div>
              <label htmlFor="user" className="nv-label">شناسه کاربر گزارش‌شونده</label>
              <input
                id="user"
                dir="ltr"
                className="nv-input"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.target.value)}
              />
            </div>

            <fieldset>
              <legend className="nv-label">دلیل گزارش</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm transition ${
                      reason === r
                        ? 'border-brand-400 bg-brand-50 font-bold text-brand-700 shadow-soft'
                        : 'border-slate-200 hover:border-brand-200 hover:bg-brand-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="h-4 w-4 text-brand-600"
                    />
                    {REPORT_REASON_LABELS[r]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="description" className="nv-label">توضیح تکمیلی (اختیاری)</label>
              <textarea
                id="description"
                rows={4}
                maxLength={1000}
                className="nv-input resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="nv-btn-primary w-full sm:w-auto sm:px-10">
              {loading ? <Spinner /> : 'ارسال گزارش'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">در حال بارگذاری…</div>}>
      <ReportForm />
    </Suspense>
  );
}
