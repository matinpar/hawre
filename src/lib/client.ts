'use client';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const TOKEN_KEY = 'hawre_session_token';

/**
 * نگه‌داری توکن نشست در مرورگر — تنها به‌عنوان جایگزین زمانی که کوکی HttpOnly
 * در محیط‌های iframe/شخص‌ثالث مسدود می‌شود. در حالت عادی کوکی استفاده می‌شود.
 *
 * ترتیب تلاش: localStorage ← sessionStorage ← حافظه موقتِ همین تب.
 * (در iframeهای sandbox شده دسترسی به Storage استثنا می‌دهد؛ در آن حالت نشست
 * تا زمان باز بودن صفحه در حافظه نگه داشته می‌شود.)
 */
let memoryToken: string | null = null;

function safeStorage(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__hawre_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  const stored = safeStorage('local')?.getItem(TOKEN_KEY) ?? safeStorage('session')?.getItem(TOKEN_KEY) ?? null;
  if (stored) memoryToken = stored;
  return stored;
}

export function setToken(token?: string | null) {
  if (!token) return;
  memoryToken = token;
  const store = safeStorage('local') ?? safeStorage('session');
  try {
    store?.setItem(TOKEN_KEY, token);
  } catch {
    /* فقط حافظه موقت در دسترس است */
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    safeStorage('local')?.removeItem(TOKEN_KEY);
    safeStorage('session')?.removeItem(TOKEN_KEY);
  } catch {
    /* نادیده */
  }
}

/** آیا نشست در حافظه موقت است؟ (یعنی با رفرش صفحه از بین می‌رود) */
export function tokenIsMemoryOnly() {
  return Boolean(memoryToken) && !safeStorage('local') && !safeStorage('session');
}

/** فراخوانی امن API با پیام خطای فارسی و بدون افشای جزئیات فنی */
export async function api<T = unknown>(
  url: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const { json, ...rest } = options;
  const token = getToken();
  try {
    const res = await fetch(url, {
      ...rest,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(rest.headers ?? {}),
      },
      body: json ? JSON.stringify(json) : rest.body,
      credentials: 'same-origin',
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok) {
      return { ok: false, error: payload?.error ?? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.' };
    }
    return { ok: true, data: payload.data as T };
  } catch {
    return { ok: false, error: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.' };
  }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'همین حالا';
  if (min < 60) return `${toFa(min)} دقیقه پیش`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${toFa(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toFa(days)} روز پیش`;
  return new Date(iso).toLocaleDateString('fa-IR');
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export function toFa(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}
