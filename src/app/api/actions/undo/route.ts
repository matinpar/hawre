import { handle, ok, requireCompleteProfile, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { orderPair } from '@/lib/matching';

export const dynamic = 'force-dynamic';

/** لغو آخرین انتخاب کاربر */
export async function POST() {
  return handle(async () => {
    const me = await requireCompleteProfile();
    const last = await prisma.userAction.findFirst({
      where: { fromUserId: me.id },
      orderBy: { createdAt: 'desc' },
    });
    if (!last) throw new HttpError('انتخاب قابل بازگشتی وجود ندارد.', 404);

    const [a, b] = orderPair(me.id, last.toUserId);
    const match = await prisma.match.findUnique({ where: { userOneId_userTwoId: { userOneId: a, userTwoId: b } } });
    if (match) {
      const messages = await prisma.message.count({ where: { matchId: match.id } });
      if (messages > 0) throw new HttpError('گفت‌وگو آغاز شده و امکان بازگشت وجود ندارد.', 409);
      await prisma.match.delete({ where: { id: match.id } });
    }
    await prisma.userAction.delete({ where: { id: last.id } });
    return ok({ message: 'آخرین انتخاب لغو شد.', restoredUserId: last.toUserId });
  });
}
