import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * اعلام «در حال نوشتن…». کلاینت حداکثر هر ۳ ثانیه یک بار صدا می‌زند.
 * فقط یک زمان‌مُهر ذخیره می‌شود؛ هیچ محتوایی ارسال یا ذخیره نمی‌شود.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('typing', me.id, 120, 60);

    const match = await prisma.match.findUnique({ where: { id: params.id } });
    if (!match || (match.userOneId !== me.id && match.userTwoId !== me.id)) {
      throw new HttpError('این گفت‌وگو یافت نشد.', 404);
    }
    if (match.status !== 'ACTIVE') throw new HttpError('این گفت‌وگو دیگر فعال نیست.', 403);

    await prisma.match.update({
      where: { id: params.id },
      data: match.userOneId === me.id ? { oneTypingAt: new Date() } : { twoTypingAt: new Date() },
    });

    return ok({ received: true });
  });
}
