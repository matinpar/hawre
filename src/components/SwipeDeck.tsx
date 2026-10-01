'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, toFa } from '@/lib/client';
import { Alert, EmptyState, Modal, SkeletonCard, Spinner } from './ui';
import { IconClose, IconHeartFilled, IconPin, IconUndo, IconArrowLeft, IconCompass, IconCheck } from './Icons';
import { GENDER_LABELS } from '@/lib/constants';
import VerifiedBadge from './VerifiedBadge';
import { useT } from '@/lib/i18n';

export type DiscoverProfile = {
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  city: string;
  bio: string;
  interests: string[];
  photos: { id: string; url: string; isPrimary: boolean }[];
  distanceKm: number | null;
  isVerified?: boolean;
};

export type DiscoverFilterState = { ageMin: number; ageMax: number; city: string; interest: string };

export const DEFAULT_FILTERS: DiscoverFilterState = { ageMin: 18, ageMax: 60, city: '', interest: '' };

/** آستانه کشیدن برای ثبت انتخاب (پیکسل) */
const SWIPE_THRESHOLD = 110;

export default function SwipeDeck({
  filters = DEFAULT_FILTERS,
  onOptions,
}: {
  filters?: DiscoverFilterState;
  onOptions?: (options: { cities: string[]; interests: string[] }) => void;
} = {}) {
  const t = useT();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [match, setMatch] = useState<{ matchId: string; profile: DiscoverProfile } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const qs = new URLSearchParams();
    if (filters.ageMin !== DEFAULT_FILTERS.ageMin) qs.set('ageMin', String(filters.ageMin));
    if (filters.ageMax !== DEFAULT_FILTERS.ageMax) qs.set('ageMax', String(filters.ageMax));
    if (filters.city) qs.set('city', filters.city);
    if (filters.interest) qs.set('interest', filters.interest);
    const query = qs.toString();

    const res = await api<{
      profiles: DiscoverProfile[];
      profileIncomplete?: boolean;
      options?: { cities: string[]; interests: string[] };
    }>(`/api/profiles/discover${query ? `?${query}` : ''}`);
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setProfiles(res.data.profiles);
    setPhotoIndex(0);
    setExpanded(false);
    if (res.data.options && onOptions) onOptions(res.data.options);
  }, [filters.ageMin, filters.ageMax, filters.city, filters.interest, onOptions]);

  useEffect(() => {
    load();
  }, [load]);

  const current = profiles[0];
  const next = profiles[1];

  const act = useCallback(
    async (type: 'LIKE' | 'PASS') => {
      if (!current || busy) return;
      setBusy(true);
      setLeaving(type === 'LIKE' ? 'right' : 'left');
      const res = await api<{ matched: boolean; matchId: string | null; profile: DiscoverProfile | null }>(
        type === 'LIKE' ? '/api/actions/like' : '/api/actions/pass',
        { method: 'POST', json: { toUserId: current.userId } },
      );

      setTimeout(() => {
        setLeaving(null);
        setDrag({ x: 0, y: 0, active: false });
        setPhotoIndex(0);
        setExpanded(false);
        setBusy(false);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setCanUndo(true);
        setProfiles((p) => p.slice(1));
        if (res.data.matched && res.data.matchId && res.data.profile) {
          setMatch({ matchId: res.data.matchId, profile: res.data.profile });
        }
      }, 280);
    },
    [current, busy],
  );

  async function undo() {
    if (busy) return;
    setBusy(true);
    const res = await api<{ message: string }>('/api/actions/undo', { method: 'POST' });
    setBusy(false);
    setCanUndo(false);
    if (!res.ok) return setError(res.error);
    load();
  }

  // کیبورد: → پسندیدن، ← رد کردن، فاصله = عکس بعدی
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (match) return;
      if (e.key === 'ArrowRight') act('LIKE');
      if (e.key === 'ArrowLeft') act('PASS');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, match]);

  if (loading) {
    return (
      <div className="mx-auto max-w-sm">
        <SkeletonCard />
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Alert kind="error">{error}</Alert>
        <button className="nv-btn-secondary w-full" onClick={load}>
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <EmptyState
          title="فعلاً پروفایل تازه‌ای نیست"
          description="همه پیشنهادهای امروز را دیده‌اید. کمی بعد دوباره سر بزنید یا ترجیحات خود را در پروفایل گسترده‌تر کنید."
          action={{ href: '/profile', label: 'ویرایش ترجیحات' }}
          icon={<IconCompass size={24} />}
        />
        <div className="flex gap-2">
          <button className="nv-btn-secondary flex-1" onClick={load}>
            بارگذاری دوباره
          </button>
          {canUndo && (
            <button className="nv-btn-ghost flex-1" onClick={undo} disabled={busy}>
              لغو آخرین انتخاب
            </button>
          )}
        </div>
      </div>
    );
  }

  const photos = current.photos.length ? current.photos : [{ id: 'none', url: '', isPrimary: true }];
  const rotate = drag.x / 22;
  const transform = leaving
    ? `translateX(${leaving === 'right' ? 150 : -150}%) rotate(${leaving === 'right' ? 20 : -20}deg)`
    : `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`;

  const likeOpacity = Math.min(Math.max(drag.x, 0) / SWIPE_THRESHOLD, 1);
  const passOpacity = Math.min(Math.max(-drag.x, 0) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative mx-auto max-w-sm pb-4 sm:pb-6">
      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* ---------- راهنمای کشیدن ---------- */}
      <div className="mb-2 hidden flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-2xs font-bold text-slate-400 sm:mb-3 sm:flex">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <IconCheck size={12} />
          </span>
          کشیدن به راست = پسندیدن
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-coral-50 text-coral-600">
            <IconClose size={12} />
          </span>
          کشیدن به چپ = رد کردن
        </span>
      </div>

      {/* ---------- دسته کارت‌ها ---------- */}
      <div className="relative -mx-4 select-none sm:mx-0" style={{ touchAction: 'pan-y' }}>
        {/* کارت بعدی به‌صورت پیش‌نمایش پشت کارت فعلی */}
        {next && (
          <div
            aria-hidden
            className="absolute inset-x-5 top-4 overflow-hidden rounded-[2rem] border border-white/60 shadow-soft transition"
            style={{ height: '100%', transform: `scale(${0.95 + Math.min(Math.abs(drag.x), 120) / 2200})` }}
          >
            {next.photos[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.photos[0].url} alt="" className="h-full w-full object-cover opacity-60" />
            ) : (
              <div className="h-full w-full bg-brand-grad opacity-40" />
            )}
          </div>
        )}
        <div aria-hidden className="absolute inset-x-6 top-1.5 h-full rounded-[2rem] bg-white/60 shadow-soft" />

        <article
          className="swipe-card nv-card relative overflow-hidden rounded-[2rem] p-0 shadow-card"
          style={{ transform, transition: drag.active ? 'none' : 'transform .28s cubic-bezier(.22,.9,.3,1)' }}
          onPointerDown={(e) => {
            if (busy) return;
            start.current = { x: e.clientX, y: e.clientY };
            moved.current = false;
            setDrag({ x: 0, y: 0, active: true });
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.active) return;
            const dx = e.clientX - start.current.x;
            const dy = e.clientY - start.current.y;
            if (Math.abs(dx) > 6) moved.current = true;
            setDrag({ x: dx, y: Math.max(-60, Math.min(60, dy * 0.25)), active: true });
          }}
          onPointerUp={() => {
            if (!drag.active) return;
            const x = drag.x;
            setDrag({ x: 0, y: 0, active: false });
            // کشیدن به راست = پسندیدن | کشیدن به چپ = رد کردن
            if (x > SWIPE_THRESHOLD) act('LIKE');
            else if (x < -SWIPE_THRESHOLD) act('PASS');
          }}
          onPointerCancel={() => setDrag({ x: 0, y: 0, active: false })}
        >
          {/* ---------- عکس بزرگ تمام‌قد ---------- */}
          <div className="relative aspect-[9/16] max-h-[calc(100svh-9.5rem)] w-full overflow-hidden bg-gradient-to-br from-brand-500 via-brand-400 to-coral-400 sm:aspect-[3/4] sm:max-h-none">
            {photos[photoIndex]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[photoIndex].url}
                alt={`عکس ${current.displayName}`}
                className="h-full w-full select-none object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-8xl font-extrabold text-white/85">
                {current.displayName.slice(0, 1)}
              </div>
            )}

            {/* نوار پیشرفت عکس‌ها + نواحی کلیک */}
            {photos.length > 1 && (
              <>
                <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
                  {photos.map((p, i) => (
                    <span
                      key={p.id}
                      className={`h-1 flex-1 rounded-full transition ${i === photoIndex ? 'bg-white shadow' : 'bg-white/35'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="عکس قبلی"
                  className="absolute inset-y-0 right-0 z-10 w-1/3"
                  onClick={() => !moved.current && setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                />
                <button
                  type="button"
                  aria-label="عکس بعدی"
                  className="absolute inset-y-0 left-0 z-10 w-1/3"
                  onClick={() => !moved.current && setPhotoIndex((i) => (i + 1) % photos.length)}
                />
              </>
            )}

            {/* مهرهای زنده هنگام کشیدن */}
            <span
              className="pointer-events-none absolute left-5 top-14 z-30 rounded-2xl border-[3px] border-emerald-400 bg-emerald-500/30 px-5 py-2 text-xl font-extrabold text-white shadow-lift backdrop-blur-sm"
              style={{ opacity: likeOpacity, transform: `rotate(-14deg) scale(${0.85 + likeOpacity * 0.2})` }}
            >
              پسندیدم
            </span>
            <span
              className="pointer-events-none absolute right-5 top-14 z-30 rounded-2xl border-[3px] border-coral-400 bg-coral-500/30 px-5 py-2 text-xl font-extrabold text-white shadow-lift backdrop-blur-sm"
              style={{ opacity: passOpacity, transform: `rotate(14deg) scale(${0.85 + passOpacity * 0.2})` }}
            >
              رد شد
            </span>

            {/* هاله رنگی هم‌جهت با کشیدن */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-emerald-400 transition-opacity"
              style={{ opacity: likeOpacity * 0.18 }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 bg-coral-500 transition-opacity"
              style={{ opacity: passOpacity * 0.18 }}
            />

            {/* اطلاعات روی عکس */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-44 text-white sm:pb-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="flex items-center gap-1.5 text-[1.7rem] font-extrabold leading-tight drop-shadow">
                  {current.displayName}
                  {current.isVerified && <VerifiedBadge size={21} className="text-white" />}
                </h2>
                <span className="text-xl font-bold text-white/95">{toFa(current.age)}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-2xs font-bold backdrop-blur">
                  {GENDER_LABELS[current.gender]}
                </span>
              </div>

              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-white/90">
                <IconPin size={14} />
                {current.city}
                {current.distanceKm !== null && ` • حدود ${toFa(current.distanceKm)} کیلومتر`}
              </p>

              {current.bio && (
                <p className={`mt-2.5 text-sm leading-7 text-white/90 ${expanded ? '' : 'line-clamp-2'}`}>
                  {current.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {current.interests.slice(0, expanded ? 8 : 3).map((i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-2xs font-bold backdrop-blur"
                  >
                    {i}
                  </span>
                ))}
                {!expanded && current.interests.length > 3 && (
                  <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-2xs font-bold backdrop-blur">
                    +{toFa(current.interests.length - 3)}
                  </span>
                )}
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="rounded-xl bg-white/15 px-3 py-1.5 text-2xs font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                  {expanded ? 'بستن' : 'بیشتر'}
                </button>
                <Link
                  href={`/profiles/${current.userId}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-2xs font-bold text-white backdrop-blur transition hover:bg-white/25"
                >
                  {t('مشاهده جزئیات')}
                  <IconArrowLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* ---------- دکمه‌های اقدام (قلب سمت راست، ضربدر سمت چپ) ---------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex items-center justify-center gap-5 sm:static sm:bottom-auto sm:mt-5">
        <button
          onClick={() => act('LIKE')}
          disabled={busy}
          aria-label="پسندیدن این پروفایل"
          title="پسندیدن (کشیدن به راست)"
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-grad text-white shadow-glow ring-4 ring-white/70 transition duration-200 hover:-translate-y-1 hover:shadow-lift active:scale-95 disabled:opacity-50 sm:ring-0"
        >
          {busy ? <Spinner /> : <IconHeartFilled size={27} />}
        </button>
        <button
          onClick={undo}
          disabled={busy || !canUndo}
          aria-label="لغو آخرین انتخاب"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-soft transition hover:-translate-y-0.5 hover:text-slate-600 active:scale-95 disabled:opacity-40"
          title="لغو آخرین انتخاب (فقط نسخه آزمایشی)"
        >
          <IconUndo size={20} />
        </button>
        <button
          onClick={() => act('PASS')}
          disabled={busy}
          aria-label="رد کردن این پروفایل"
          title="رد کردن (کشیدن به چپ)"
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-coral-100 bg-white text-coral-500 shadow-lift ring-4 ring-white/70 transition duration-200 hover:-translate-y-1 hover:border-coral-200 hover:shadow-glowCoral active:scale-95 disabled:opacity-50 sm:ring-0"
        >
          <IconClose size={27} />
        </button>
      </div>

      {/* ---------- پنجره آشنایی دوطرفه ---------- */}
      <Modal open={Boolean(match)} onClose={() => setMatch(null)} title="یک آشنایی دوطرفه شکل گرفت!">
        {match && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[1.75rem] bg-brand-100 ring-4 ring-brand-100/60">
              {match.profile.photos[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.profile.photos[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-brand-600">{match.profile.displayName.slice(0, 1)}</span>
              )}
            </div>
            <p className="text-sm leading-7 text-slate-600">
              یک آشنایی دوطرفه شکل گرفت! حالا می‌توانید گفت‌وگو را شروع کنید.
            </p>
            <div className="mt-6 flex gap-2">
              <button className="nv-btn-secondary flex-1" onClick={() => setMatch(null)}>
                ادامه کاوش
              </button>
              <Link className="nv-btn-primary flex-1" href={`/chat/${match.matchId}`}>
                شروع گفت‌وگو
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
