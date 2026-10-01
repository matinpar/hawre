'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DICTIONARIES } from './i18n-dict';

/**
 * چندزبانه‌سازی سبک و بدون وابستگی بیرونی.
 *
 * الگو: «کلید = همان متن فارسی». هر رشته‌ای که هنوز ترجمه ندارد،
 * به‌صورت خودکار به فارسی نمایش داده می‌شود؛ بنابراین هیچ صفحه‌ای
 * هرگز خالی یا شکسته نمی‌شود.
 */

export const LOCALES = ['fa', 'ckb', 'ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; native: string; dir: 'rtl' | 'ltr'; flagText: string }> = {
  fa: { label: 'فارسی', native: 'فارسی', dir: 'rtl', flagText: 'فا' },
  ckb: { label: 'کردی سۆرانی', native: 'کوردی', dir: 'rtl', flagText: 'کو' },
  ar: { label: 'العربية', native: 'العربية', dir: 'rtl', flagText: 'ع' },
  en: { label: 'English', native: 'English', dir: 'ltr', flagText: 'EN' },
};

const STORAGE_KEY = 'hawre_locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'fa';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* Storage در iframe محدود در دسترس نیست */
  }
  return 'fa';
}

type I18nValue = {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (next: Locale) => void;
  t: (fa: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fa');
  // تا وقتی انتخاب ذخیره‌شده خوانده نشده، چیزی روی <html> نوشته نمی‌شود
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const apply = useCallback((next: Locale) => {
    const dir = LOCALE_META[next].dir;
    document.documentElement.lang = next === 'ckb' ? 'ckb' : next;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* نادیده */
    }
  }, []);

  useEffect(() => {
    if (ready) apply(locale);
  }, [locale, ready, apply]);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTIONARIES[locale];
    return {
      locale,
      dir: LOCALE_META[locale].dir,
      setLocale: (next: Locale) => setLocaleState(next),
      // اگر ترجمه‌ای نبود، همان متن فارسی برگردانده می‌شود
      t: (fa: string) => dict?.[fa] ?? fa,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** هوک اصلی ترجمه: `const { t } = useI18n()` */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  // در صورت استفاده بیرون از Provider، رفتار امن: فارسی
  return { locale: 'fa', dir: 'rtl', setLocale: () => {}, t: (fa: string) => fa };
}

/** میان‌بر پرکاربرد */
export function useT() {
  return useI18n().t;
}
