import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { getCurrentUser, readSession } from './auth';
import { prisma } from './prisma';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** لایه‌ی امن اجرای هندلرها: خطاها هرگز جزئیات داخلی را لو نمی‌دهند */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) return fail(err.message, err.status);
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return fail(first?.message ?? 'داده‌های ارسالی نامعتبر است.', 422);
    }
    console.error('[API ERROR]', err);
    return fail('خطای غیرمنتظره در سرور رخ داد. لطفاً دوباره تلاش کنید.', 500);
  }
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError('بدنه درخواست نامعتبر است.', 400);
  }
  return schema.parse(json);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError('برای انجام این عملیات باید وارد حساب خود شوید.', 401);
  return user;
}

export async function requireCompleteProfile() {
  const user = await requireUser();
  if (!user.profile?.profileCompleted) {
    throw new HttpError('ابتدا پروفایل خود را تکمیل کنید.', 403);
  }
  return user;
}

export async function requireAdmin() {
  const session = await readSession();
  if (!session) throw new HttpError('برای انجام این عملیات باید وارد حساب خود شوید.', 401);
  // نقش را همیشه از پایگاه داده می‌خوانیم، نه صرفاً از توکن
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, role: true, accountStatus: true, email: true },
  });
  if (!user || user.accountStatus !== 'ACTIVE' || user.role !== 'ADMIN') {
    throw new HttpError('دسترسی به این بخش مجاز نیست.', 403);
  }
  return user;
}
