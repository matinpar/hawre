'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearToken, toFa } from '@/lib/client';
import { useT } from '@/lib/i18n';
import { Spinner } from './ui';
import { IconChat, IconCompass, IconGrid, IconLogout, IconSettings, IconUser } from './Icons';

const ITEMS = [
  { href: '/discover', label: 'کاوش', Icon: IconCompass },
  { href: '/matches', label: 'آشنایی‌ها', Icon: IconChat },
  { href: '/profile', label: 'پروفایل', Icon: IconUser },
  { href: '/settings', label: 'تنظیمات', Icon: IconSettings },
];

/** شمارنده پیام‌های خوانده‌نشده با به‌روزرسانی سبک هر ۲۰ ثانیه */
function useUnreadMessages(pathname: string) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await api<{ messages: number }>('/api/notifications/unread');
      if (alive && res.ok) setUnread(res.data.messages);
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pathname]);
  return unread;
}

function UnreadBadge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} پیام خوانده‌نشده`}
      className={`pointer-events-none absolute flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-coral-500 px-1 text-[0.62rem] font-extrabold text-white shadow-[0_2px_6px_rgba(229,55,92,0.45)] ring-2 ring-white ${className}`}
    >
      {toFa(count > 99 ? '+۹۹' : count)}
    </span>
  );
}

export function NavLinks({ isAdmin, variant }: { isAdmin: boolean; variant: 'header' | 'bottom' }) {
  const pathname = usePathname();
  const unread = useUnreadMessages(pathname);
  const t = useT();
  const items = isAdmin ? [...ITEMS, { href: '/admin', label: 'مدیریت', Icon: IconGrid }] : ITEMS;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (variant === 'header') {
    return (
      <ul className="flex items-center gap-1 rounded-2xl bg-slate-900/[.04] p-1">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition duration-200 ${
                  active
                    ? 'bg-white text-brand-700 shadow-soft'
                    : 'text-slate-500 hover:bg-white/70 hover:text-ink'
                }`}
              >
                <Icon size={17} className={active ? 'text-brand-500' : 'text-slate-400'} />
                {t(label)}
                {href === '/matches' && <UnreadBadge count={unread} className="-top-1 left-1" />}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-1.5">
      {items.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className="group relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-2xs font-bold transition"
            >
              <span
                className={`relative flex h-9 w-full max-w-[3.25rem] items-center justify-center rounded-xl transition duration-300 ${
                  active ? 'bg-brand-grad text-white shadow-glow' : 'text-slate-400 group-hover:bg-slate-100'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2 : 1.8} />
                {href === '/matches' && <UnreadBadge count={unread} className="top-0 -left-1" />}
              </span>
              <span className={active ? 'text-brand-700' : 'text-slate-400'}>{t(label)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    await api('/api/auth/logout', { method: 'POST' });
    clearToken();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-coral-50 hover:text-coral-500 disabled:opacity-50"
      aria-label={t('خروج از حساب')}
      title={t('خروج از حساب')}
    >
      {loading ? <Spinner className="border-slate-300 border-t-slate-600" /> : <IconLogout size={19} />}
    </button>
  );
}
