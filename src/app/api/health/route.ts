import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * بررسی سلامت سرویس برای HEALTHCHECK داکر / Load Balancer.
 * هیچ داده حساسی برنمی‌گرداند.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, data: { status: 'healthy', time: new Date().toISOString() } });
  } catch {
    return NextResponse.json({ ok: false, error: 'دیتابیس در دسترس نیست.' }, { status: 503 });
  }
}
