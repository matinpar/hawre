'use client';

import { useCallback, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import SwipeDeck, { DEFAULT_FILTERS, type DiscoverFilterState } from '@/components/SwipeDeck';
import DiscoverFilters from '@/components/DiscoverFilters';
import { IconCompass } from '@/components/Icons';
import { useT } from '@/lib/i18n';

export default function DiscoverPage() {
  const t = useT();
  const [filters, setFilters] = useState<DiscoverFilterState>(DEFAULT_FILTERS);
  const [options, setOptions] = useState<{ cities: string[]; interests: string[] }>({ cities: [], interests: [] });

  const handleOptions = useCallback((next: { cities: string[]; interests: string[] }) => {
    setOptions((prev) =>
      prev.cities.length === next.cities.length && prev.interests.length === next.interests.length ? prev : next,
    );
  }, []);

  return (
    <AppFrame>
      <div className="mb-4 hidden items-center justify-center gap-3 sm:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-grad text-white shadow-glow">
          <IconCompass size={20} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{t('کاوش')}</h1>
          <p className="text-xs text-slate-500">{t('افراد پیشنهادی بر اساس ترجیحات شما')}</p>
        </div>
      </div>

      <DiscoverFilters value={filters} onChange={setFilters} options={options} />

      <SwipeDeck filters={filters} onOptions={handleOptions} />
    </AppFrame>
  );
}
