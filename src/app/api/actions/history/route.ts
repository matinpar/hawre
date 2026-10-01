import { handle, ok, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    const actions = await prisma.userAction.findMany({
      where: { fromUserId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, toUserId: true, actionType: true, createdAt: true },
    });
    return ok({ actions });
  });
}
