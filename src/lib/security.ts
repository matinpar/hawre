import 'server-only';
import { headers } from 'next/headers';
import { prisma } from './prisma';
import { HttpError } from './api';

/** حذف تگ‌ها و کاراکترهای خطرناک از متن آزاد کاربر (دفاع لایه‌ای در کنار escape پیش‌فرض React) */
export function sanitizeText(input: string): string {
  return input
    .replace(/<\/?[^>]*>/g, '') // حذف هر تگ HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function clientIp(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * محدودیت نرخ درخواست مبتنی بر پایگاه داده (بدون وابستگی پولی مانند Redis).
 * @param scope نام عملیات، مثل login
 * @param identifier شناسه (IP یا ایمیل یا شناسه کاربر)
 */
export async function rateLimit(scope: string, identifier: string, limit: number, windowSeconds: number) {
  const key = `${scope}:${identifier}`;
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowEnd < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowEnd: new Date(now.getTime() + windowSeconds * 1000) },
      update: { count: 1, windowEnd: new Date(now.getTime() + windowSeconds * 1000) },
    });
    return;
  }

  if (existing.count >= limit) {
    const seconds = Math.max(1, Math.ceil((existing.windowEnd.getTime() - now.getTime()) / 1000));
    throw new HttpError(`درخواست‌های بیش از حد. لطفاً ${seconds} ثانیه دیگر تلاش کنید.`, 429);
  }

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
}
