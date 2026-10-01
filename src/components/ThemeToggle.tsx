'use client';

import { useEffect, useState } from 'react';
import { IconMoon, IconSun, IconMonitor } from './Icons';
import { useT } from '@/lib/i18n';

export type ThemeChoice = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'hawre_theme';

/** خواندن انتخاب ذخیره‌شده؛ در iframeهای محدود بی‌خطر شکست می‌خورد */
function readChoice(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* دسترسی به Storage مسدود است */
  }
  return 'system';
}

export function applyTheme(choice: ThemeChoice) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = choice === 'dark' || (choice === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* نادیده */
  }
}

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof IconSun }[] = [
  { value: 'light', label: 'روشن', Icon: IconSun },
  { value: 'system', label: 'سیستم', Icon: IconMonitor },
  { value: 'dark', label: 'تاریک', Icon: IconMoon },
];

/** انتخابگر سه‌حالته تم (روشن / سیستم / تاریک) */
export default function ThemeToggle() {
  const t = useT();
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    setChoice(readChoice());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readChoice() === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function pick(value: ThemeChoice) {
    setChoice(value);
    applyTheme(value);
  }

  return (
    <div role="radiogroup" aria-label="حالت نمایش" className="flex items-center gap-1 rounded-2xl bg-slate-900/[.04] p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
              active ? 'bg-white text-brand-700 shadow-soft' : 'text-slate-500 hover:bg-white/60'
            }`}
          >
            <Icon size={16} />
            {t(label)}
          </button>
        );
      })}
    </div>
  );
}

/** دکمه کوچک تغییر سریع تم برای هدر */
export function ThemeQuickToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      title={dark ? 'حالت روشن' : 'حالت تاریک'}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
    >
      {dark ? <IconSun size={19} /> : <IconMoon size={19} />}
    </button>
  );
}
