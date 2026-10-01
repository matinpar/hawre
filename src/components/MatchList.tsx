'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, timeAgo, toFa } from '@/lib/client';
import { Alert, Avatar, EmptyState } from './ui';
import { IconChat, IconSearch } from './Icons';
import VerifiedBadge from './VerifiedBadge';
import { useT } from '@/lib/i18n';

type MatchItem = {
  matchId: string;
  lastMessageAt: string | null;
  lastActiveAt: string;
  unread: number;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  profile: {
    userId: string;
    displayName: string;
    age: number;
    city: string;
    photos: { url: string }[];
    isVerified?: boolean;
  };
};

export default function MatchList() {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [query, setQuery] = useState('');
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<{ matches: MatchItem[] }>('/api/matches');
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setItems(res.data.matches);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((m) => m.profile.displayName.includes(query.trim()));

  if (loading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="nv-card flex items-center gap-4 p-4">
            <span className="nv-skeleton h-14 w-14 rounded-2xl" />
            <span className="flex-1 space-y-2">
              <span className="nv-skeleton block h-4 w-1/3" />
              <span className="nv-skeleton block h-3 w-2/3" />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (error) return <Alert kind="error">{error}</Alert>;

  if (items.length === 0) {
    return (
      <EmptyState
        title="هنوز آشنایی دوطرفه‌ای ندارید"
        description="وقتی شما و شخص دیگری یکدیگر را بپسندید، اینجا یک گفت‌وگوی تازه ساخته می‌شود."
        action={{ href: '/discover', label: 'رفتن به کاوش' }}
        icon={<IconChat size={24} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <label htmlFor="search" className="sr-only">
        جست‌وجو بین آشنایی‌ها
      </label>
      <div className="relative">
        <IconSearch size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="search"
          className="nv-input pr-11"
          placeholder={t('جست‌وجوی نام…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="nv-card p-8 text-center text-sm text-slate-500">نتیجه‌ای برای «{query}» پیدا نشد.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((m) => (
            <li key={m.matchId}>
              <Link
                href={`/chat/${m.matchId}`}
                className="nv-card nv-card-hover group flex items-center gap-4 p-4"
              >
                <span className="relative shrink-0">
                  <Avatar src={m.profile.photos[0]?.url} name={m.profile.displayName} size={56} ring />
                  {m.unread > 0 && (
                    <span className="absolute -left-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-coral-500 ring-2 ring-white" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="truncate font-extrabold text-ink transition group-hover:text-brand-700">
                      {m.profile.displayName}
                      {m.profile.isVerified && <VerifiedBadge size={15} className="mr-1" />}
                    </h3>
                    <span className="text-xs text-slate-400">{toFa(m.profile.age)}</span>
                  </div>
                  <p
                    className={`truncate text-sm ${
                      m.unread > 0 ? 'font-bold text-ink' : 'text-slate-500'
                    }`}
                  >
                    {m.lastMessage ? m.lastMessage.content : 'هنوز پیامی رد و بدل نشده است.'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-slate-400">{timeAgo(m.lastMessageAt ?? m.lastActiveAt)}</span>
                  {m.unread > 0 && (
                    <span className="rounded-full bg-brand-grad px-2 py-0.5 text-[10px] font-bold text-white shadow-glow">
                      {toFa(m.unread)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
