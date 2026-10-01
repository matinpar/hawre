'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { IconClose, IconInfo, IconSparkle, IconWarn, IconCheck } from './Icons';

export function Logo({ size = 'md', withText = true }: { size?: 'sm' | 'md' | 'lg'; withText?: boolean }) {
  const dim = size === 'sm' ? 34 : size === 'lg' ? 56 : 42;
  const text = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* نشان رسمی هاوڕێ — دو قلب درهم‌تنیده */}
      <img
        src="/brand/logo-mark.png"
        alt="نشان هاوڕێ"
        width={dim}
        height={dim}
        style={{ width: dim, height: dim }}
        className="select-none object-contain drop-shadow-[0_4px_10px_rgba(229,55,92,0.25)]"
        draggable={false}
      />
      {withText && <span className={`${text} font-extrabold tracking-tight text-ink`}>هاوڕێ</span>}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="در حال بارگذاری"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white ${className}`}
    />
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const map = {
    error: { cls: 'nv-error', icon: <IconWarn size={18} className="mt-0.5 shrink-0" /> },
    success: { cls: 'nv-success', icon: <IconCheck size={18} className="mt-0.5 shrink-0" /> },
    info: {
      cls: 'flex items-start gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700',
      icon: <IconInfo size={18} className="mt-0.5 shrink-0" />,
    },
  }[kind];

  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`${map.cls} animate-floatUp`}>
      {map.icon}
      <span className="leading-6">{children}</span>
    </div>
  );
}

/** تیتر بخش‌ها با آیکون و توضیح کوتاه */
export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-grad text-white shadow-glow">
            {icon}
          </span>
        )}
        <div>
          <h1 className="nv-title">{title}</h1>
          {subtitle && <p className="nv-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="nv-card flex animate-floatUp flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="relative mb-1 flex h-20 w-20 items-center justify-center rounded-full bg-brand-grad-soft">
        <span className="absolute inset-0 animate-ping2 rounded-full bg-brand-200/50" aria-hidden />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-500 shadow-soft">
          {icon ?? <IconSparkle size={24} />}
        </span>
      </span>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      <p className="max-w-sm text-sm leading-7 text-slate-500">{description}</p>
      {action && (
        <Link href={action.href} className="nv-btn-primary mt-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  labelledBy = 'modal-title',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full max-w-md animate-pop overflow-hidden rounded-t-[1.75rem] border border-white/70 bg-white p-6 shadow-lift outline-none sm:rounded-[1.75rem]"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-grad" />
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-ink"
        >
          <IconClose size={18} />
        </button>
        {title && (
          <h2 id={labelledBy} className="mb-3 pl-10 text-lg font-extrabold text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}

/** رنگ ثابت و قابل پیش‌بینی برای هر نام (بدون تصادف در هر رندر) */
const AVATAR_GRADIENTS = [
  'from-brand-500 to-amber-400',
  'from-amber-400 to-brand-400',
  'from-coral-500 to-brand-400',
  'from-brand-600 to-amber-300',
  'from-plum-600 to-brand-400',
  'from-amber-500 to-coral-400',
];

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export function Avatar({
  src,
  name,
  size = 48,
  ring = false,
}: {
  src?: string | null;
  name: string;
  size?: number;
  ring?: boolean;
}) {
  const ringCls = ring ? 'ring-2 ring-white shadow-soft' : '';
  if (src) {
    return (
      <img
        src={src}
        alt={`تصویر پروفایل ${name}`}
        width={size}
        height={size}
        className={`rounded-2xl object-cover ${ringCls}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradientFor(name)} font-extrabold text-white ${ringCls}`}
      style={{ width: size, height: size, fontSize: size / 2.4 }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="nv-card overflow-hidden">
      <div className="nv-skeleton h-80 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="nv-skeleton h-5 w-2/5" />
        <div className="nv-skeleton h-4 w-3/5" />
        <div className="nv-skeleton h-4 w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="nv-skeleton h-6 w-16 rounded-full" />
          <div className="nv-skeleton h-6 w-14 rounded-full" />
          <div className="nv-skeleton h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
