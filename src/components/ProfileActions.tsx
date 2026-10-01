'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/client';
import { Alert, Modal, Spinner } from './ui';

export default function ProfileActions({ userId, displayName }: { userId: string; displayName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);

  async function act(kind: 'LIKE' | 'PASS') {
    if (busy) return;
    setBusy(true);
    setError('');
    const res = await api<{ matched: boolean; matchId: string | null }>(
      kind === 'LIKE' ? '/api/actions/like' : '/api/actions/pass',
      { method: 'POST', json: { toUserId: userId } },
    );
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.data.matched && res.data.matchId) {
      setMatchId(res.data.matchId);
    } else {
      setSuccess(kind === 'LIKE' ? 'پسندیدن ثبت شد.' : 'این پروفایل رد شد.');
      setTimeout(() => router.push('/discover'), 900);
    }
  }

  async function block() {
    setBusy(true);
    const res = await api<{ message: string }>(`/api/users/${userId}/block`, { method: 'POST' });
    setBusy(false);
    setConfirmBlock(false);
    if (!res.ok) return setError(res.error);
    router.push('/discover');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <Alert kind="error">{error}</Alert>}
      {success && <Alert kind="success">{success}</Alert>}

      <div className="flex gap-3">
        <button onClick={() => act('PASS')} disabled={busy} className="nv-btn-secondary flex-1">
          رد کردن
        </button>
        <button onClick={() => act('LIKE')} disabled={busy} className="nv-btn-primary flex-1">
          {busy ? <Spinner /> : 'پسندیدن'}
        </button>
      </div>

      <div className="flex gap-3">
        <Link href={`/report?user=${userId}`} className="nv-btn-ghost flex-1 text-sm">
          گزارش کاربر
        </Link>
        <button onClick={() => setConfirmBlock(true)} disabled={busy} className="nv-btn-ghost flex-1 text-sm text-coral-600">
          مسدود کردن
        </button>
      </div>

      <Modal open={confirmBlock} onClose={() => setConfirmBlock(false)} title="مسدود کردن کاربر">
        <p className="text-sm leading-7 text-slate-600">
          آیا مطمئن هستید که می‌خواهید «{displayName}» را مسدود کنید؟ پس از این، شما و این کاربر یکدیگر را در کاوش و
          فهرست آشنایی‌ها نخواهید دید.
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => setConfirmBlock(false)} className="nv-btn-secondary flex-1">
            انصراف
          </button>
          <button onClick={block} disabled={busy} className="nv-btn-danger flex-1">
            {busy ? <Spinner /> : 'بله، مسدود کن'}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(matchId)} onClose={() => setMatchId(null)} title="یک آشنایی دوطرفه شکل گرفت!">
        <p className="text-sm leading-7 text-slate-600">
          شما و {displayName} یکدیگر را پسندیدید. حالا می‌توانید گفت‌وگو را شروع کنید.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href={`/chat/${matchId}`} className="nv-btn-primary flex-1">
            شروع گفت‌وگو
          </Link>
          <Link href="/discover" className="nv-btn-secondary flex-1">
            ادامه کاوش
          </Link>
        </div>
      </Modal>
    </div>
  );
}
