'use client';

import { useState } from 'react';
import { toFa } from '@/lib/client';
import { Modal } from './ui';
import { IconFilter, IconClose } from './Icons';
import type { DiscoverFilterState } from './SwipeDeck';
import { DEFAULT_FILTERS } from './SwipeDeck';
import { useT } from '@/lib/i18n';

function isDefault(f: DiscoverFilterState) {
  return (
    f.ageMin === DEFAULT_FILTERS.ageMin &&
    f.ageMax === DEFAULT_FILTERS.ageMax &&
    !f.city &&
    !f.interest
  );
}

/** نوار فیلتر کاوش: بازه سنی، شهر و علاقه‌مندی — موقتی و بدون تغییر ترجیحات ذخیره‌شده */
export default function DiscoverFilters({
  value,
  onChange,
  options,
}: {
  value: DiscoverFilterState;
  onChange: (next: DiscoverFilterState) => void;
  options: { cities: string[]; interests: string[] };
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const [draft, setDraft] = useState<DiscoverFilterState>(value);

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function apply() {
    const next = { ...draft };
    if (next.ageMin > next.ageMax) [next.ageMin, next.ageMax] = [next.ageMax, next.ageMin];
    onChange(next);
    setOpen(false);
  }

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (value.ageMin !== DEFAULT_FILTERS.ageMin || value.ageMax !== DEFAULT_FILTERS.ageMax) {
    chips.push({
      key: 'age',
      label: `${toFa(value.ageMin)} تا ${toFa(value.ageMax)} سال`,
      clear: () => onChange({ ...value, ageMin: DEFAULT_FILTERS.ageMin, ageMax: DEFAULT_FILTERS.ageMax }),
    });
  }
  if (value.city) chips.push({ key: 'city', label: value.city, clear: () => onChange({ ...value, city: '' }) });
  if (value.interest)
    chips.push({ key: 'interest', label: value.interest, clear: () => onChange({ ...value, interest: '' }) });

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={openSheet}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
          isDefault(value)
            ? 'border-slate-200 bg-white text-slate-500 hover:text-ink'
            : 'border-brand-200 bg-brand-50 text-brand-700'
        }`}
      >
        <IconFilter size={16} />
        {t('فیلترها')}
      </button>

      {chips.map((c) => (
        <span key={c.key} className="nv-chip inline-flex items-center gap-1.5 !py-1.5 text-xs">
          {c.label}
          <button type="button" onClick={c.clear} aria-label={`حذف فیلتر ${c.label}`} className="opacity-70 hover:opacity-100">
            <IconClose size={13} />
          </button>
        </span>
      ))}

      {!isDefault(value) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-xs font-bold text-slate-400 underline underline-offset-4 hover:text-brand-600"
        >
          {t('پاک کردن همه')}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('فیلتر نتایج کاوش')}>
        <div className="space-y-5 text-right">
          <div>
            <label className="nv-label" htmlFor="ageMin">
              بازه سنی: {toFa(draft.ageMin)} تا {toFa(draft.ageMax)} سال
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input
                id="ageMin"
                type="range"
                min={18}
                max={80}
                value={draft.ageMin}
                onChange={(e) => setDraft({ ...draft, ageMin: Number(e.target.value) })}
                className="w-full accent-brand-500"
                aria-label="حداقل سن"
              />
              <input
                type="range"
                min={18}
                max={80}
                value={draft.ageMax}
                onChange={(e) => setDraft({ ...draft, ageMax: Number(e.target.value) })}
                className="w-full accent-brand-500"
                aria-label="حداکثر سن"
              />
            </div>
            <p className="nv-hint mt-1">حداقل سن مجاز سرویس ۱۸ سال است.</p>
          </div>

          <div>
            <label className="nv-label" htmlFor="city">
              {t('شهر')}
            </label>
            <select
              id="city"
              className="nv-input mt-1"
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            >
              <option value="">همه شهرها</option>
              {options.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="nv-label">{t('علاقه‌مندی مشترک')}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, interest: '' })}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  !draft.interest ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'
                }`}
              >
                {t('همه')}
              </button>
              {options.interests.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDraft({ ...draft, interest: draft.interest === i ? '' : i })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    draft.interest === i
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-500 hover:text-ink'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={apply} className="nv-btn nv-btn-primary flex-1">
              {t('نمایش نتایج')}
            </button>
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_FILTERS)}
              className="nv-btn nv-btn-secondary"
            >
              {t('بازنشانی')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
