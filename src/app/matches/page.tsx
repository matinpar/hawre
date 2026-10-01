'use client';

import AppFrame from '@/components/AppFrame';
import MatchList from '@/components/MatchList';
import { PageHeader } from '@/components/ui';
import { IconChat } from '@/components/Icons';
import { useT } from '@/lib/i18n';

export default function MatchesPage() {
  const t = useT();
  return (
    <AppFrame>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={t('آشنایی‌ها')}
          subtitle={t('افرادی که شما و آن‌ها یکدیگر را پسندیده‌اید.')}
          icon={<IconChat size={22} />}
        />
        <MatchList />
      </div>
    </AppFrame>
  );
}
