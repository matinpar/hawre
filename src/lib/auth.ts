import 'server-only';
import { cookies, headers } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './prisma';

const SESSION_COOKIE = 'hawre_session';
const DEFAULT_MAX_AGE = 60 * 60 * 24; // 1 روز
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 روز

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET تعریف نشده است. فایل .env را بررسی کنید.');
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: string; role: string };

/**
 * ویژگی‌های کوکی بر اساس بستر اجرا.
 * روی HTTPS (مثلاً محیط پیش‌نمایش که داخل iframe با دامنه متفاوت اجرا می‌شود)
 * باید SameSite=None + Secure باشد وگرنه مرورگر کوکی نشست را ذخیره نمی‌کند.
 * روی http://localhost حالت امن‌تر Lax استفاده می‌شود.
 */
export function cookieOptions(maxAge: number) {
  let host = '';
  let proto = '';
  try {
    const h = headers();
    host = h.get('host') ?? '';
    proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? '';
  } catch {
    // خارج از چرخه درخواست (مثلاً اسکریپت‌ها)
  }

  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(host);
  // اگر میزبان محلی نباشد، برنامه از طریق HTTPS و احتمالاً داخل iframe سرو می‌شود؛
  // در این حالت کوکی باید SameSite=None + Secure + Partitioned باشد وگرنه مرورگر آن را دور می‌اندازد.
  const crossSite =
    process.env.COOKIE_CROSS_SITE === 'true' ||
    (process.env.COOKIE_CROSS_SITE !== 'false' && (!isLocal || proto === 'https'));

  return {
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: (crossSite ? 'none' : 'lax') as 'none' | 'lax',
    secure: crossSite,
    ...(crossSite ? { partitioned: true } : {}),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(userId: string, role: string, maxAge: number) {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());
}

/**
 * ساخت نشست. علاوه بر کوکی HttpOnly، خود توکن هم برگردانده می‌شود تا در محیط‌هایی که
 * مرورگر کوکی شخص‌ثالث را مسدود می‌کند (مثل پیش‌نمایش داخل iframe) کلاینت بتواند آن را
 * نگه دارد و در هدر Authorization بفرستد.
 */
export async function createSession(userId: string, role: string, remember = false) {
  const maxAge = remember ? REMEMBER_MAX_AGE : DEFAULT_MAX_AGE;
  const token = await signSessionToken(userId, role, maxAge);
  cookies().set(SESSION_COOKIE, token, cookieOptions(maxAge));
  return token;
}

/** آیا بازگرداندن توکن به کلاینت مجاز است؟ (پیش‌فرض: بله در توسعه، خیر در Production) */
export function tokenFallbackEnabled() {
  if (process.env.ALLOW_TOKEN_FALLBACK === 'true') return true;
  if (process.env.ALLOW_TOKEN_FALLBACK === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function destroySession() {
  cookies().set(SESSION_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

export async function readSession(): Promise<SessionPayload | null> {
  let token = cookies().get(SESSION_COOKIE)?.value;
  if (!token && tokenFallbackEnabled()) {
    try {
      const auth = headers().get('authorization');
      if (auth?.toLowerCase().startsWith('bearer ')) token = auth.slice(7).trim();
    } catch {
      // خارج از چرخه درخواست
    }
  }
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return { sub: String(payload.sub), role: String(payload.role ?? 'USER') };
  } catch {
    return null;
  }
}

/** کاربر جاری همراه با پروفایل — تنها فیلدهای مجاز */
export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      role: true,
      accountStatus: true,
      emailVerified: true,
      authProvider: true,
      createdAt: true,
      profile: true,
      settings: true,
      photos: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
    },
  });
  if (!user || user.accountStatus !== 'ACTIVE') return null;
  return user;
}

export async function touchLastActive(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
}

/* ------------ توکن‌های یکبارمصرف (تأیید ایمیل / بازیابی رمز) ------------ */

export function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type TokenType = 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'OAUTH_HANDOFF';

export async function issueToken(userId: string, type: TokenType, ttlMinutes = 60) {
  const raw = randomToken();
  await prisma.token.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    },
  });
  return raw;
}

export async function consumeToken(raw: string, type: TokenType) {
  const record = await prisma.token.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) return null;
  await prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
