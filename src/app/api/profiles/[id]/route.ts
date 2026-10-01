import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { toPublicProfile } from '@/lib/serializers';
import { blockedUserIds } from '@/lib/matching';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const blocked = await blockedUserIds(me.id);
    if (blocked.includes(params.id)) throw new HttpError('این پروفایل در دسترس نیست.', 403);

    const user = await prisma.user.findFirst({
      where: { id: params.id, accountStatus: 'ACTIVE' },
      include: { profile: true, photos: true },
    });
    const pub = user ? toPublicProfile(user, { showDistance: me.settings?.showDistance !== false }) : null;
    if (!pub) throw new HttpError('پروفایل موردنظر یافت نشد.', 404);
    return ok({ profile: pub });
  });
}
