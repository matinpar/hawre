'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, clearToken } from '@/lib/client';
import { Alert, Modal, Spinner } from './ui';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

type SettingsData = {
  showDistance: boolean;
  notifyMatches: boolean;
  notifyMessages: boolean;
  discoverable: boolean;
  showOnline: boolean;
};

export default function SettingsPanel({
  email,
  emailVerified,
  authProvider,
  settings,
}: {
  email: string;
  emailVerified: boolean;
  authProvider: string;
  settings: SettingsData;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [flags, setFlags] = useState<SettingsData>(settings);
  const [newEmail, setNewEmail] = useState(email);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function toggle(key: keyof SettingsData, value: boolean) {
    setFlags((f) => ({ ...f, [key]: value }));
    const res = await api('/api/settings', { method: 'PATCH', json: { [key]: value } });
    if (!res.ok) {
      setFlags((f) => ({ ...f, [key]: !value }));
      setMsg({ kind: 'error', text: res.error });
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await api('/api/settings', { method: 'PATCH', json: { email: newEmail } });
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.error });
    setMsg({ kind: 'success', text: 'ایمیل به‌روزرسانی شد. لطفاً آن را دوباره تأیید کنید.' });
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMsg(null);
    if (pw.newPassword.length < 8) return setMsg({ kind: 'error', text: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' });
    if (pw.newPassword !== pw.confirmPassword)
      return setMsg({ kind: 'error', text: 'رمز عبور جدید و تکرار آن یکسان نیستند.' });

    setBusy(true);
    const res = await api<{ message: string }>('/api/auth/change-password', { method: 'POST', json: pw });
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.error });
    setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMsg({ kind: 'success', text: res.data.message });
  }

  async function deleteAccount() {
    setBusy(true);
    const res = await api('/api/account', { method: 'DELETE', json: { confirm: confirmText } });
    setBusy(false);
    if (!res.ok) return setMsg({ kind: 'error', text: res.error });
    clearToken();
    router.push('/');
    router.refresh();
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    clearToken();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      <section className="nv-card p-6">
        <h2 className="mb-4 text-base font-extrabold text-ink">{t('حساب کاربری')}</h2>
        <form onSubmit={saveEmail} className="space-y-3">
          <label htmlFor="email" className="nv-label">
            ایمیل {emailVerified ? '(تأییدشده)' : '(تأیید نشده)'}
          </label>
          <input
            id="email"
            type="email"
            dir="ltr"
            className="nv-input"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <p className="text-xs text-slate-500">روش ورود فعلی: {providerLabel(authProvider)}</p>
          <button type="submit" disabled={busy || newEmail === email} className="nv-btn-secondary">
            {busy ? <Spinner className="border-brand-200 border-t-brand-600" /> : 'ذخیره ایمیل'}
          </button>
        </form>
      </section>

      <section className="nv-card p-6">
        <h2 className="mb-4 text-base font-extrabold text-ink">{t('تغییر رمز عبور')}</h2>
        <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="cpw" className="nv-label">رمز فعلی</label>
            <input id="cpw" type="password" dir="ltr" className="nv-input" value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label htmlFor="npw" className="nv-label">رمز جدید</label>
            <input id="npw" type="password" dir="ltr" className="nv-input" value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
          <div>
            <label htmlFor="rpw" className="nv-label">تکرار رمز جدید</label>
            <input id="rpw" type="password" dir="ltr" className="nv-input" value={pw.confirmPassword}
              onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={busy} className="nv-btn-secondary">
              تغییر رمز عبور
            </button>
          </div>
        </form>
      </section>

      <section className="nv-card p-6">
        <h2 className="mb-1.5 text-base font-extrabold text-ink">{t('زبان')}</h2>
        <p className="mb-4 text-xs text-slate-500">
          زبان رابط کاربری روی همین دستگاه ذخیره می‌شود. متن‌هایی که هنوز ترجمه نشده‌اند به فارسی نمایش داده می‌شوند.
        </p>
        <LanguageSwitcher />
      </section>

      <section className="nv-card p-6">
        <h2 className="mb-1.5 text-base font-extrabold text-ink">{t('حالت نمایش')}</h2>
        <p className="mb-4 text-xs text-slate-500">
          انتخاب شما روی همین دستگاه ذخیره می‌شود. حالت «سیستم» از تنظیمات گوشی یا رایانه پیروی می‌کند.
        </p>
        <ThemeToggle />
      </section>

      <section className="nv-card p-6">
        <h2 className="mb-4 text-base font-extrabold text-ink">{t('حریم خصوصی و اعلان‌ها')}</h2>
        <ul className="space-y-3">
          <ToggleRow
            label="نمایش فاصله تقریبی در پروفایل من"
            hint="مکان دقیق شما هرگز ذخیره یا نمایش داده نمی‌شود."
            checked={flags.showDistance}
            onChange={(v) => toggle('showDistance', v)}
          />
          <ToggleRow
            label="نمایش پروفایل من در کاوش دیگران"
            checked={flags.discoverable}
            onChange={(v) => toggle('discoverable', v)}
          />
          <ToggleRow
            label="نمایش وضعیت آنلاین و آخرین بازدید"
            hint="فقط کسانی که با آن‌ها آشنایی دوطرفه دارید این وضعیت را می‌بینند."
            checked={flags.showOnline}
            onChange={(v) => toggle('showOnline', v)}
          />
          <ToggleRow
            label="اعلان آشنایی‌های تازه"
            checked={flags.notifyMatches}
            onChange={(v) => toggle('notifyMatches', v)}
          />
          <ToggleRow
            label="اعلان پیام‌های جدید"
            checked={flags.notifyMessages}
            onChange={(v) => toggle('notifyMessages', v)}
          />
        </ul>
      </section>

      <section className="nv-card p-6">
        <h2 className="mb-4 text-base font-extrabold text-ink">{t('قوانین و پشتیبانی')}</h2>
        <div className="flex flex-wrap gap-3 text-sm font-bold">
          <Link href="/terms" className="nv-btn-ghost">قوانین استفاده</Link>
          <Link href="/privacy" className="nv-btn-ghost">حریم خصوصی</Link>
          <Link href="/report" className="nv-btn-ghost">گزارش و پشتیبانی</Link>
        </div>
      </section>

      <section className="nv-card border-coral-200 p-6">
        <h2 className="mb-2 text-base font-extrabold text-coral-600">منطقه خطر</h2>
        <p className="mb-4 text-sm leading-7 text-slate-600">
          با حذف حساب، پروفایل، عکس‌ها و انتخاب‌های شما برای همیشه پاک می‌شوند و گفت‌وگوهای شما برای طرف مقابل به شکل
          ناشناس باقی می‌ماند. این عمل بازگشت‌پذیر نیست.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={logout} className="nv-btn-secondary">خروج از حساب</button>
          <button onClick={() => setConfirmDelete(true)} className="nv-btn-danger">حذف حساب</button>
        </div>
      </section>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="حذف حساب کاربری">
        <p className="text-sm leading-7 text-slate-600">
          برای تأیید، عبارت <span className="font-extrabold">حذف حساب</span> را در کادر زیر بنویسید.
        </p>
        <input
          className="nv-input mt-3"
          aria-label="تأیید حذف حساب"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
        <div className="mt-6 flex gap-2">
          <button className="nv-btn-secondary flex-1" onClick={() => setConfirmDelete(false)}>انصراف</button>
          <button
            className="nv-btn-danger flex-1"
            disabled={confirmText.trim() !== 'حذف حساب' || busy}
            onClick={deleteAccount}
          >
            {busy ? <Spinner /> : 'حذف نهایی'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <span>
        <span className="block text-sm font-bold text-slate-700">{label}</span>
        {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      </span>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-200" />
        <span className="absolute right-1 h-4 w-4 rounded-full bg-white transition peer-checked:-translate-x-5" />
      </label>
    </li>
  );
}

function providerLabel(p: string) {
  if (p === 'GOOGLE') return 'حساب Google';
  if (p === 'BOTH') return 'ایمیل و حساب Google';
  return 'ایمیل و رمز عبور';
}
