'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, clockTime, toFa } from '@/lib/client';
import { Alert, Avatar, Modal, Spinner } from './ui';
import {
  IconArrowRight,
  IconBan,
  IconChat,
  IconCheck,
  IconCheckDouble,
  IconChevronDown,
  IconClock,
  IconFlag,
  IconMore,
  IconSend,
  IconTrash,
} from './Icons';
import VerifiedBadge from './VerifiedBadge';
import { useI18n } from '@/lib/i18n';

type Message = { id: string; senderId: string; content: string; isRead: boolean; createdAt: string; mine: boolean };
type PendingMessage = { id: string; content: string; failed?: boolean };

const GROUP_WINDOW_MS = 5 * 60 * 1000; // پیام‌های پشت‌سرهم تا ۵ دقیقه در یک گروه نمایش داده می‌شوند
const MAX_LEN = 1000;

/** آیا کاربر در ۳ دقیقه گذشته فعال بوده است؟ */
function isOnline(iso: string | null) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 1000;
}

/** «آخرین بازدید» به زبان ساده */
function lastSeenLabel(iso: string | null, t: (s: string) => string) {
  if (!iso) return null;
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 3) return t('آنلاین');
  if (mins < 60) return `${t('آخرین بازدید')} ${toFa(mins)} ${t('دقیقه پیش')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${t('آخرین بازدید')} ${toFa(hours)} ${t('ساعت پیش')}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return `${t('آخرین بازدید')} ${t('دیروز')}`;
  if (days < 30) return `${t('آخرین بازدید')} ${toFa(days)} ${t('روز پیش')}`;
  return t('آخرین بازدید مدتی پیش');
}

/** برچسب روز برای جداکننده تاریخ: امروز / دیروز / تاریخ کامل */
function dayLabel(iso: string, locale: string, t: (s: string) => string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return t('امروز');
  if (same(d, yesterday)) return t('دیروز');
  const tag = locale === 'fa' ? 'fa-IR-u-ca-persian' : locale === 'ckb' ? 'ckb-IQ' : locale === 'ar' ? 'ar' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export default function ChatRoom({
  matchId,
  other,
}: {
  matchId: string;
  other: { userId: string; displayName: string; photo: string | null; isVerified?: boolean };
}) {
  const router = useRouter();
  const { t, locale } = useI18n();

  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerLastActiveAt, setPeerLastActiveAt] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastTypingSent = useRef(0);
  const lastCount = useRef(0);

  /* ------------------------- داده ------------------------- */

  const load = useCallback(async () => {
    const res = await api<{ messages: Message[]; peerTyping?: boolean; peerLastActiveAt?: string | null }>(
      `/api/matches/${matchId}/messages`,
    );
    setLoading(false);
    if (!res.ok) return setError(res.error);
    setMessages(res.data.messages);
    setPeerTyping(!!res.data.peerTyping);
    setPeerLastActiveAt(res.data.peerLastActiveAt ?? null);
  }, [matchId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSent.current < 3000) return;
    lastTypingSent.current = now;
    api(`/api/matches/${matchId}/typing`, { method: 'POST' });
  }, [matchId]);

  useEffect(() => {
    load();
    // وقتی طرف مقابل در حال نوشتن است سریع‌تر به‌روزرسانی می‌کنیم
    const timer = setInterval(load, peerTyping ? 3000 : 8000);
    return () => clearInterval(timer);
  }, [load, peerTyping]);

  /* ------------------------- اسکرول ------------------------- */

  const scrollToEnd = useCallback((behavior: ScrollBehavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior, block: 'end' });
    setUnseenCount(0);
  }, []);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    setAtBottom(near);
    if (near) setUnseenCount(0);
  }

  useEffect(() => {
    const total = messages.length + pending.length;
    const grew = total > lastCount.current;
    lastCount.current = total;
    if (!grew) return;
    if (atBottom) scrollToEnd(loading ? 'auto' : 'smooth');
    else setUnseenCount((c) => c + 1);
  }, [messages.length, pending.length, atBottom, loading, scrollToEnd]);

  // بستن منوی سه‌نقطه با کلیک بیرون یا کلید Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  /* ------------------------- ارسال ------------------------- */

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }

  const sendText = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || sending) return;
      setError('');
      setSending(true);
      const tempId = `tmp-${Date.now()}`;
      setPending((p) => [...p, { id: tempId, content }]);
      setText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }

      const res = await api<{ message: Message }>(`/api/matches/${matchId}/messages`, {
        method: 'POST',
        json: { content },
      });
      setSending(false);
      setPending((p) => p.filter((x) => x.id !== tempId));
      if (!res.ok) {
        setError(res.error);
        setText(content);
        return;
      }
      setMessages((m) => [...m, res.data.message]);
      setAtBottom(true);
    },
    [matchId, sending],
  );

  async function deleteConversation() {
    const res = await api(`/api/matches/${matchId}`, { method: 'DELETE' });
    setConfirmDelete(false);
    if (!res.ok) return setError(res.error);
    router.push('/matches');
    router.refresh();
  }

  async function block() {
    const res = await api(`/api/users/${other.userId}/block`, { method: 'POST' });
    setConfirmBlock(false);
    if (!res.ok) return setError(res.error);
    router.push('/matches');
    router.refresh();
  }

  /* ------------------------- گروه‌بندی پیام‌ها ------------------------- */

  type Row =
    | { kind: 'day'; key: string; label: string }
    | { kind: 'msg'; key: string; msg: Message; firstOfGroup: boolean; lastOfGroup: boolean };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
      if (newDay) out.push({ kind: 'day', key: `d-${m.id}`, label: dayLabel(m.createdAt, locale, t) });

      const sameAsPrev =
        !!prev &&
        !newDay &&
        prev.mine === m.mine &&
        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
      const sameAsNext =
        !!next &&
        next.mine === m.mine &&
        new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < GROUP_WINDOW_MS &&
        new Date(next.createdAt).toDateString() === new Date(m.createdAt).toDateString();

      out.push({ kind: 'msg', key: m.id, msg: m, firstOfGroup: !sameAsPrev, lastOfGroup: !sameAsNext });
    });
    return out;
  }, [messages, locale, t]);

  const openers = [t('سلام! حالت چطوره؟'), t('از پروفایلت خوشم اومد'), t('اهل کدوم بخش شهری؟')];
  const online = isOnline(peerLastActiveAt);
  const remaining = MAX_LEN - text.length;

  /* ------------------------- رابط ------------------------- */

  return (
    <div className="mx-auto flex h-[calc(100vh-10.5rem)] max-w-2xl flex-col md:h-[calc(100vh-8.5rem)]">
      {/* ---------- هدر ---------- */}
      <header className="nv-card-glass relative z-40 mb-3 flex items-center gap-2 p-2 sm:gap-3 sm:p-2.5">
        <Link
          href="/matches"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          aria-label={t('بازگشت به فهرست آشنایی‌ها')}
        >
          <IconArrowRight size={18} />
        </Link>

        <Link href={`/profiles/${other.userId}`} className="group flex min-w-0 flex-1 items-center gap-3">
          <span className="relative shrink-0">
            <Avatar src={other.photo} name={other.displayName} size={42} ring />
            {online && (
              <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 truncate font-extrabold text-ink transition group-hover:text-brand-700">
              {other.displayName}
              {other.isVerified && <VerifiedBadge size={15} />}
            </span>
            <span
              className={`block truncate text-2xs ${
                peerTyping
                  ? 'font-bold text-brand-600'
                  : online
                    ? 'font-bold text-emerald-600'
                    : 'text-slate-400'
              }`}
            >
              {peerTyping ? t('در حال نوشتن…') : (lastSeenLabel(peerLastActiveAt, t) ?? t('مشاهده پروفایل'))}
            </span>
          </span>
        </Link>

        {/* منوی اقدامات */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t('اقدامات گفت‌وگو')}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              menuOpen ? 'bg-slate-100 text-ink' : 'text-slate-400 hover:bg-slate-100 hover:text-ink'
            }`}
          >
            <IconMore size={18} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="nv-card absolute left-0 top-12 z-50 w-52 animate-floatUp overflow-hidden p-1.5 text-sm shadow-lift"
            >
              <Link
                href={`/profiles/${other.userId}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              >
                <IconChat size={16} />
                {t('مشاهده پروفایل')}
              </Link>
              <Link
                href={`/report?user=${other.userId}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-slate-600 transition hover:bg-slate-100 hover:text-ink"
              >
                <IconFlag size={16} />
                {t('گزارش کاربر')}
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmBlock(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-coral-600 transition hover:bg-coral-50"
              >
                <IconBan size={16} />
                {t('مسدود کردن')}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 font-bold text-coral-600 transition hover:bg-coral-50"
              >
                <IconTrash size={16} />
                {t('حذف گفت‌وگو')}
              </button>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* ---------- بدنه گفت‌وگو ---------- */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="nv-card h-full overflow-y-auto bg-white/80 p-3 backdrop-blur sm:p-4"
        >
          {loading ? (
            <div className="space-y-3">
              <div className="nv-skeleton h-11 w-1/2 rounded-[1.25rem]" />
              <div className="nv-skeleton mr-auto h-14 w-2/3 rounded-[1.25rem]" />
              <div className="nv-skeleton h-11 w-1/3 rounded-[1.25rem]" />
              <div className="nv-skeleton mr-auto h-11 w-1/2 rounded-[1.25rem]" />
            </div>
          ) : messages.length === 0 && pending.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-grad text-white shadow-glow">
                <IconChat size={26} />
              </span>
              <p className="text-base font-extrabold text-ink">{t('هنوز پیامی نیست')}</p>
              <p className="max-w-xs text-xs leading-6 text-slate-500">
                {t('اولین پیام را شما بفرستید؛ یک سلام ساده هم کافی است.')}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {openers.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setText(o);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {rows.map((row) =>
                row.kind === 'day' ? (
                  <li key={row.key} className="sticky top-0 z-10 flex justify-center py-2">
                    <span className="rounded-full border border-slate-100 bg-white/90 px-3 py-1 text-2xs font-bold text-slate-400 shadow-soft backdrop-blur">
                      {row.label}
                    </span>
                  </li>
                ) : (
                  <li
                    key={row.key}
                    className={`flex items-end gap-2 ${row.msg.mine ? 'justify-start' : 'justify-end'} ${
                      row.lastOfGroup ? 'pb-2' : 'pb-0.5'
                    }`}
                  >
                    {/* آواتار کوچک فقط کنار آخرین پیامِ گروهِ طرف مقابل */}
                    {!row.msg.mine &&
                      (row.lastOfGroup ? (
                        <span className="order-2 shrink-0">
                          <Avatar src={other.photo} name={other.displayName} size={26} />
                        </span>
                      ) : (
                        <span className="order-2 w-[26px] shrink-0" aria-hidden />
                      ))}

                    <div
                      className={`group relative max-w-[78%] px-3.5 py-2.5 text-sm leading-7 shadow-soft transition ${
                        row.msg.mine
                          ? `bg-brand-grad text-white ${
                              row.firstOfGroup ? 'rounded-[1.25rem] rounded-tr-md' : 'rounded-[1.25rem] rounded-tr-md'
                            } ${row.lastOfGroup ? 'rounded-br-sm' : ''}`
                          : `order-1 border border-slate-100 bg-white text-slate-700 ${
                              row.firstOfGroup ? 'rounded-[1.25rem] rounded-tl-md' : 'rounded-[1.25rem] rounded-tl-md'
                            } ${row.lastOfGroup ? 'rounded-bl-sm' : ''}`
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{row.msg.content}</p>
                      {row.lastOfGroup && (
                        <span
                          className={`mt-1 flex items-center gap-1 text-[10px] ${
                            row.msg.mine ? 'justify-start text-white/75' : 'justify-end text-slate-400'
                          }`}
                        >
                          {clockTime(row.msg.createdAt)}
                          {row.msg.mine &&
                            (row.msg.isRead ? (
                              <IconCheckDouble size={14} className="text-white" />
                            ) : (
                              <IconCheck size={13} className="text-white/75" />
                            ))}
                        </span>
                      )}
                    </div>
                  </li>
                ),
              )}

              {/* در حال نوشتن */}
              {peerTyping && (
                <li className="flex items-end justify-end gap-2 pb-2" aria-live="polite">
                  <span className="order-2 shrink-0">
                    <Avatar src={other.photo} name={other.displayName} size={26} />
                  </span>
                  <div className="order-1 flex items-center gap-1.5 rounded-[1.25rem] rounded-bl-sm border border-slate-100 bg-white px-4 py-3.5 shadow-soft">
                    <span className="sr-only">
                      {other.displayName} {t('در حال نوشتن…')}
                    </span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
                      />
                    ))}
                  </div>
                </li>
              )}

              {/* پیام‌های در حال ارسال */}
              {pending.map((p) => (
                <li key={p.id} className="flex justify-start pb-2">
                  <div className="max-w-[78%] rounded-[1.25rem] rounded-br-sm bg-brand-grad px-3.5 py-2.5 text-sm leading-7 text-white opacity-70 shadow-soft">
                    <p className="whitespace-pre-line break-words">{p.content}</p>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-white/80">
                      <IconClock size={12} />
                      {t('در حال ارسال…')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div ref={endRef} />
        </div>

        {/* دکمه شناور «رفتن به آخرین پیام» */}
        {!atBottom && !loading && (
          <button
            type="button"
            onClick={() => scrollToEnd()}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink/90 px-3.5 py-2 text-xs font-bold text-white shadow-lift backdrop-blur transition hover:bg-ink"
          >
            <IconChevronDown size={15} />
            {unseenCount > 0 ? `${toFa(unseenCount)} ${t('پیام جدید')}` : t('آخرین پیام‌ها')}
          </button>
        )}
      </div>

      {/* ---------- نوار نوشتن ---------- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendText(text);
        }}
        className="mt-3 flex items-end gap-2 rounded-[1.5rem] border border-white/70 bg-white/85 p-2 shadow-soft backdrop-blur focus-within:border-brand-200"
      >
        <label htmlFor="message" className="sr-only">
          {t('متن پیام')}
        </label>
        <textarea
          id="message"
          ref={inputRef}
          rows={1}
          className="nv-input max-h-[8.25rem] min-h-[2.75rem] resize-none border-transparent bg-transparent py-2.5 leading-7 shadow-none focus:ring-0"
          placeholder={t('پیام خود را بنویسید…')}
          maxLength={MAX_LEN}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoGrow(e.target);
            if (e.target.value.trim()) notifyTyping();
          }}
          onKeyDown={(e) => {
            // Enter برای ارسال، Shift+Enter برای خط جدید
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              sendText(text);
            }
          }}
        />

        {remaining <= 100 && (
          <span className={`self-center text-2xs font-bold ${remaining <= 0 ? 'text-coral-600' : 'text-slate-400'}`}>
            {toFa(remaining)}
          </span>
        )}

        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="nv-btn-primary h-11 w-11 shrink-0 rounded-2xl p-0 transition disabled:opacity-40"
          aria-label={t('ارسال پیام')}
          title={t('ارسال پیام')}
        >
          {sending ? <Spinner /> : <IconSend size={19} />}
        </button>
      </form>

      <p className="mt-1.5 hidden px-2 text-center text-2xs text-slate-400 sm:block">
        {t('برای ارسال Enter و برای خط جدید Shift + Enter را بزنید.')}
      </p>

      {/* ---------- پنجره‌های تأیید ---------- */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('حذف گفت‌وگو')}>
        <p className="text-sm leading-7 text-slate-600">
          این گفت‌وگو از فهرست شما حذف می‌شود و دیگر امکان ارسال پیام وجود نخواهد داشت. ادامه می‌دهید؟
        </p>
        <div className="mt-6 flex gap-2">
          <button className="nv-btn-secondary flex-1" onClick={() => setConfirmDelete(false)}>
            {t('انصراف')}
          </button>
          <button className="nv-btn-danger flex-1" onClick={deleteConversation}>
            {t('حذف گفت‌وگو')}
          </button>
        </div>
      </Modal>

      <Modal open={confirmBlock} onClose={() => setConfirmBlock(false)} title={t('مسدود کردن کاربر')}>
        <p className="text-sm leading-7 text-slate-600">
          «{other.displayName}» مسدود شود؟ پس از این یکدیگر را نخواهید دید.
        </p>
        <div className="mt-6 flex gap-2">
          <button className="nv-btn-secondary flex-1" onClick={() => setConfirmBlock(false)}>
            {t('انصراف')}
          </button>
          <button className="nv-btn-danger flex-1" onClick={block}>
            بله، مسدود کن
          </button>
        </div>
      </Modal>
    </div>
  );
}
