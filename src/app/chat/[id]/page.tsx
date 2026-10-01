'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import ChatRoom from '@/components/ChatRoom';
import { Alert, Spinner } from '@/components/ui';
import { api } from '@/lib/client';

type MatchResponse = {
  match: {
    id: string;
    status: string;
    profile: { userId: string; displayName: string; isVerified?: boolean; photos: { url: string }[] } | null;
  };
};

export default function ChatPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<MatchResponse['match'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const res = await api<MatchResponse>(`/api/matches/${params.id}`);
      if (!res.ok) return setError(res.error);
      setData(res.data.match);
    })();
  }, [params.id]);

  return (
    <AppFrame>
      {error ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <Alert kind="error">{error}</Alert>
          <Link href="/matches" className="nv-btn-secondary">
            بازگشت به آشنایی‌ها
          </Link>
        </div>
      ) : !data?.profile ? (
        <div className="flex justify-center p-10">
          <Spinner className="border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <ChatRoom
          matchId={data.id}
          other={{
            userId: data.profile.userId,
            displayName: data.profile.displayName,
            photo: data.profile.photos[0]?.url ?? null,
            isVerified: data.profile.isVerified,
          }}
        />
      )}
    </AppFrame>
  );
}
