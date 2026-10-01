'use client';

import { LOCALES, LOCALE_META, useI18n, type Locale } from '@/lib/i18n';

/** انتخابگر زبان — چهار زبان: فارسی، کردی سۆرانی، عربی، انگلیسی */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div role="radiogroup" aria-label={t('زبان')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LOCALES.map((code: Locale) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(code)}
            className={`rounded-2xl border px-3 py-2.5 text-sm font-bold transition ${
              active
                ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-soft'
                : 'border-slate-200 text-slate-500 hover:border-brand-200 hover:text-ink'
            }`}
          >
            {LOCALE_META[code].native}
          </button>
        );
      })}
    </div>
  );
}

/** نسخه فشرده برای هدر/صفحات ورود */
export function LanguageQuickSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
      <span className="sr-only">{t('زبان')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t('زبان')}
        className="cursor-pointer rounded-xl border border-slate-200 bg-white/70 px-2.5 py-1.5 text-xs font-bold text-slate-600 outline-none transition hover:border-brand-200"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_META[code].native}
          </option>
        ))}
      </select>
    </label>
  );
}
