'use client';

import { useEffect, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import SettingsPanel from '@/components/SettingsPanel';
import { Alert, PageHeader, Spinner } from '@/components/ui';
import { IconSettings } from '@/components/Icons';
import { api } from '@/lib/client';

type SettingsResponse = {
  settings: {
    showDistance: boolean;
    notifyMatches: boolean;
    notifyMessages: boolean;
    discoverable: boolean;
    showOnline: boolean;
  };
  email: string;
  emailVerified: boolean;
  authProvider: string;
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api<SettingsResponse>('/api/settings');
      if (!res.ok) return setError(res.error);
      setData(res.data);
    })();
  }, []);

  return (
    <AppFrame requireProfile={false}>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="تنظیمات"
          subtitle="حساب، حریم خصوصی و اعلان‌های خود را مدیریت کنید."
          icon={<IconSettings size={22} />}
        />
        {error ? (
          <Alert kind="error">{error}</Alert>
        ) : !data ? (
          <div className="nv-card flex justify-center p-10">
            <Spinner className="border-brand-200 border-t-brand-600" />
          </div>
        ) : (
          <SettingsPanel
            email={data.email}
            emailVerified={data.emailVerified}
            authProvider={data.authProvider}
            settings={{
              showDistance: data.settings.showDistance,
              notifyMatches: data.settings.notifyMatches,
              notifyMessages: data.settings.notifyMessages,
              discoverable: data.settings.discoverable,
              showOnline: data.settings.showOnline !== false,
            }}
          />
        )}
      </div>
    </AppFrame>
  );
}
