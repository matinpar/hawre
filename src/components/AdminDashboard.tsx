'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, timeAgo, toFa } from '@/lib/client';
import { Alert, Spinner } from './ui';
import { ACCOUNT_STATUS_LABELS, REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '@/lib/constants';

type Stats = {
  users: number;
  activeUsers: number;
  newToday: number;
  newWeek: number;
  matches: number;
  messages: number;
  reports: number;
  verifiedUsers: number;
  pendingVerifications: number;
  pendingReports: number;
  blocks: number;
};

type AdminUser = {
  id: string;
  email: string;
  role: string;
  accountStatus: string;
  emailVerified: boolean;
  authProvider: string;
  createdAt: string;
  lastActiveAt: string;
  profile: { displayName: string; city: string; profileCompleted: boolean } | null;
  _count: { reportsAgainst: number };
};

type AdminReport = {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporter: { id: string; profile: { displayName: string } | null };
  reported: { id: string; accountStatus: string; profile: { displayName: string; city: string } | null };
};

type AdminVerification = {
  id: string;
  status: string;
  gesture: string;
  selfieUrl: string | null;
  note: string;
  createdAt: string;
  user: { id: string; displayName: string; city: string; isVerified: boolean; primaryPhoto: string | null };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (q = '') => {
    setLoading(true);
    const [s, u, r, v] = await Promise.all([
      api<{ stats: Stats }>('/api/admin/stats'),
      api<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`),
      api<{ reports: AdminReport[] }>('/api/admin/reports'),
      api<{ verifications: AdminVerification[] }>('/api/admin/verifications?status=PENDING'),
    ]);
    setLoading(false);
    if (!s.ok) return setError(s.error);
    setStats(s.data.stats);
    if (u.ok) setUsers(u.data.users);
    if (r.ok) setReports(r.data.reports);
    if (v.ok) setVerifications(v.data.verifications);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, accountStatus: string) {
    setMessage('');
    const res = await api<{ message: string }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      json: { accountStatus },
    });
    if (!res.ok) return setError(res.error);
    setMessage(res.data.message);
    load(query);
  }

  async function reviewVerification(id: string, action: 'APPROVE' | 'REJECT') {
    setMessage('');
    const res = await api<{ message: string }>(`/api/admin/verifications/${id}`, {
      method: 'PATCH',
      json: { action, note: rejectNote[id] ?? '' },
    });
    if (!res.ok) return setError(res.error);
    setMessage(res.data.message);
    load(query);
  }

  async function updateReport(id: string, status?: string, action?: string) {
    setMessage('');
    const res = await api<{ message: string }>(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      json: { status, action },
    });
    if (!res.ok) return setError(res.error);
    setMessage(res.data.message);
    load(query);
  }

  if (loading && !stats) {
    return (
      <div className="flex justify-center p-10">
        <Spinner className="border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert kind="error">{error}</Alert>}
      {message && <Alert kind="success">{message}</Alert>}

      <section>
        <h2 className="mb-3 text-base font-extrabold text-ink">داشبورد آماری</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="کل کاربران" value={stats?.users ?? 0} />
          <StatCard label="کاربران فعال" value={stats?.activeUsers ?? 0} />
          <StatCard label="کاربران جدید امروز" value={stats?.newToday ?? 0} />
          <StatCard label="کاربران جدید هفته" value={stats?.newWeek ?? 0} />
          <StatCard label="آشنایی‌ها" value={stats?.matches ?? 0} />
          <StatCard label="پیام‌ها" value={stats?.messages ?? 0} />
          <StatCard label="گزارش‌های باز" value={stats?.pendingReports ?? 0} tone="warn" />
          <StatCard label="مسدودسازی‌ها" value={stats?.blocks ?? 0} />
          <StatCard label="پروفایل تأییدشده" value={stats?.verifiedUsers ?? 0} />
          <StatCard label="تأیید در انتظار" value={stats?.pendingVerifications ?? 0} tone="warn" />
        </div>
      </section>

      <section className="nv-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink">کاربران</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(query);
            }}
            className="flex gap-2"
          >
            <label htmlFor="q" className="sr-only">جست‌وجوی کاربر</label>
            <input
              id="q"
              className="nv-input py-2 text-sm"
              placeholder="ایمیل یا نام…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="nv-btn-secondary py-2 text-sm">جست‌وجو</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="p-2 font-bold">کاربر</th>
                <th className="p-2 font-bold">روش ورود</th>
                <th className="p-2 font-bold">وضعیت</th>
                <th className="p-2 font-bold">گزارش‌ها</th>
                <th className="p-2 font-bold">آخرین فعالیت</th>
                <th className="p-2 font-bold">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-2">
                    <div className="font-bold text-ink">{u.profile?.displayName ?? '— بدون پروفایل —'}</div>
                    <div className="text-xs text-slate-400">{u.profile?.city ?? ''}</div>
                  </td>
                  <td className="p-2 text-xs text-slate-500">{u.authProvider}</td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        u.accountStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-coral-50 text-coral-600'
                      }`}
                    >
                      {ACCOUNT_STATUS_LABELS[u.accountStatus]}
                    </span>
                  </td>
                  <td className="p-2 text-xs">{toFa(u._count.reportsAgainst)}</td>
                  <td className="p-2 text-xs text-slate-400">{timeAgo(u.lastActiveAt)}</td>
                  <td className="p-2">
                    {u.accountStatus === 'ACTIVE' ? (
                      <button onClick={() => setStatus(u.id, 'DISABLED')} className="nv-btn-ghost px-3 py-1 text-xs text-coral-600">
                        غیرفعال کردن
                      </button>
                    ) : (
                      <button onClick={() => setStatus(u.id, 'ACTIVE')} className="nv-btn-ghost px-3 py-1 text-xs text-emerald-700">
                        فعال کردن
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-slate-400">کاربری یافت نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          ایمیل کاربران در این فهرست نمایش داده نمی‌شود؛ تنها اطلاعات لازم برای مدیریت نشان داده می‌شود.
        </p>
      </section>

      <section className="nv-card p-5">
        <h2 className="mb-1 text-base font-extrabold text-ink">
          صف تأیید هویت {verifications.length > 0 && <span className="text-brand-600">({toFa(verifications.length)})</span>}
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          تصویر سلفی فقط برای همین بررسی نگه داشته می‌شود و بلافاصله پس از تأیید یا رد، برای همیشه حذف می‌گردد.
        </p>
        {verifications.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">درخواستی در صف بررسی نیست.</p>
        ) : (
          <ul className="space-y-3">
            {verifications.map((v) => (
              <li key={v.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex gap-2">
                    {v.selfieUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.selfieUrl}
                        alt="سلفی ارسالی برای تأیید هویت"
                        className="h-28 w-24 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    )}
                    {v.user.primaryPhoto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.user.primaryPhoto}
                        alt="عکس اصلی پروفایل"
                        className="h-28 w-24 rounded-xl object-cover opacity-90 ring-1 ring-slate-200"
                      />
                    )}
                  </div>

                  <div className="min-w-[14rem] flex-1">
                    <p className="font-bold text-ink">
                      {v.user.displayName}
                      <span className="mr-2 text-xs font-normal text-slate-400">{v.user.city}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ژست خواسته‌شده: <span className="font-bold text-brand-700">{v.gesture}</span>
                    </p>
                    <p className="mt-1 text-2xs text-slate-400">ارسال {timeAgo(v.createdAt)}</p>

                    <input
                      value={rejectNote[v.id] ?? ''}
                      onChange={(e) => setRejectNote((n) => ({ ...n, [v.id]: e.target.value }))}
                      placeholder="یادداشت برای کاربر (اختیاری، در صورت رد)"
                      maxLength={300}
                      className="nv-input mt-3 text-xs"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => reviewVerification(v.id, 'APPROVE')}
                        className="nv-btn-ghost px-3 py-1 text-xs font-bold text-emerald-700"
                      >
                        تأیید پروفایل
                      </button>
                      <button
                        onClick={() => reviewVerification(v.id, 'REJECT')}
                        className="nv-btn-ghost px-3 py-1 text-xs font-bold text-coral-600"
                      >
                        رد درخواست
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="nv-card p-5">
        <h2 className="mb-4 text-base font-extrabold text-ink">گزارش‌ها</h2>
        {reports.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">گزارشی ثبت نشده است.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-ink">{REPORT_REASON_LABELS[r.reason]}</span>
                    <span className="mr-2 text-xs text-slate-400">
                      علیه {r.reported.profile?.displayName ?? 'کاربر حذف‌شده'} • {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    {REPORT_STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.description && <p className="mt-2 text-sm leading-7 text-slate-600">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => updateReport(r.id, 'REVIEWING')} className="nv-btn-ghost px-3 py-1 text-xs">
                    در حال بررسی
                  </button>
                  <button onClick={() => updateReport(r.id, 'RESOLVED')} className="nv-btn-ghost px-3 py-1 text-xs text-emerald-700">
                    رسیدگی شد
                  </button>
                  <button onClick={() => updateReport(r.id, 'REJECTED')} className="nv-btn-ghost px-3 py-1 text-xs">
                    رد گزارش
                  </button>
                  <button onClick={() => updateReport(r.id, 'RESOLVED', 'REMOVE_PHOTOS')} className="nv-btn-ghost px-3 py-1 text-xs text-coral-600">
                    حذف عکس‌ها
                  </button>
                  <button onClick={() => updateReport(r.id, 'RESOLVED', 'REMOVE_BIO')} className="nv-btn-ghost px-3 py-1 text-xs text-coral-600">
                    حذف معرفی
                  </button>
                  <button onClick={() => updateReport(r.id, 'RESOLVED', 'DISABLE_USER')} className="nv-btn-ghost px-3 py-1 text-xs text-coral-600">
                    غیرفعال کردن کاربر
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className={`nv-card p-4 ${tone === 'warn' ? 'border-coral-200' : ''}`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${tone === 'warn' ? 'text-coral-600' : 'text-brand-700'}`}>
        {toFa(value)}
      </div>
    </div>
  );
}
