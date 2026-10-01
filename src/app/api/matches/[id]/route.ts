import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { toPublicProfile } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

async function getMatchFor(userId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userOne: { include: { profile: true, photos: true } },
      userTwo: { include: { profile: true, photos: true } },
    },
  });
  if (!match || (match.userOneId !== userId && match.userTwoId !== userId)) {
    throw new HttpError('این گفت‌وگو یافت نشد.', 404);
  }
  return match;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const match = await getMatchFor(me.id, params.id);
    const other = match.userOneId === me.id ? match.userTwo : match.userOne;
    return ok({
      match: {
        id: match.id,
        status: match.status,
        createdAt: match.createdAt.toISOString(),
        profile: toPublicProfile(other, { showDistance: me.settings?.showDistance !== false }),
      },
    });
  });
}

/** حذف گفت‌وگو / لغو Match */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const match = await getMatchFor(me.id, params.id);
    await prisma.match.update({ where: { id: match.id }, data: { status: 'UNMATCHED' } });
    return ok({ message: 'گفت‌وگو حذف شد.' });
  });
}
