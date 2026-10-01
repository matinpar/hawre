import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * شمارش سبک پیام‌های خوانده‌نشده برای نشان (badge) نوار پایین.
 * فقط عدد برمی‌گرداند؛ هیچ داده شخصی افشا نمی‌شود.
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ ok: false, error: 'وارد نشده‌اید.' }, { status: 401 });

  const messages = await prisma.message.count({
    where: { receiverId: me.id, isRead: false, deletedAt: null },
  });

  return NextResponse.json({ ok: true, data: { messages } });
}
