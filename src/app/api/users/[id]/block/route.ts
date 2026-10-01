import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { orderPair } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    if (params.id === me.id) throw new HttpError('نمی‌توانید خودتان را مسدود کنید.', 400);
    const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!target) throw new HttpError('کاربر یافت نشد.', 404);

    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: me.id, blockedId: params.id } },
      create: { blockerId: me.id, blockedId: params.id },
      update: {},
    });

    const [a, b] = orderPair(me.id, params.id);
    await prisma.match.updateMany({
      where: { userOneId: a, userTwoId: b },
      data: { status: 'UNMATCHED' },
    });

    return ok({ message: 'کاربر مسدود شد و دیگر او را نخواهید دید.' });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    await prisma.block.deleteMany({ where: { blockerId: me.id, blockedId: params.id } });
    return ok({ message: 'مسدودیت کاربر برداشته شد.' });
  });
}
