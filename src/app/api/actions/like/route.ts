import { handle, ok, parseBody, requireCompleteProfile, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { actionSchema } from '@/lib/validation';
import { recordAction, blockedUserIds } from '@/lib/matching';
import { rateLimit } from '@/lib/security';
import { toPublicProfile } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireCompleteProfile();
    await rateLimit('action', me.id, 300, 60 * 60);
    const { toUserId } = await parseBody(req, actionSchema);
    if (toUserId === me.id) throw new HttpError('نمی‌توانید پروفایل خودتان را انتخاب کنید.', 400);

    const blocked = await blockedUserIds(me.id);
    if (blocked.includes(toUserId)) throw new HttpError('این کاربر در دسترس نیست.', 403);

    const target = await prisma.user.findFirst({
      where: { id: toUserId, accountStatus: 'ACTIVE' },
      include: { profile: true, photos: true },
    });
    if (!target) throw new HttpError('کاربر موردنظر یافت نشد.', 404);

    const result = await recordAction(me.id, toUserId, 'LIKE');
    return ok({
      matched: result.matched,
      matchId: result.matched ? result.matchId : null,
      profile: result.matched ? toPublicProfile(target) : null,
    });
  });
}
