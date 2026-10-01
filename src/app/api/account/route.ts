import { handle, ok, parseBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { deleteAccountSchema } from '@/lib/validation';
import { destroySession } from '@/lib/auth';
import { deleteUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/**
 * سیاست حذف حساب: داده‌های شخصی (ایمیل، رمز، پروفایل، عکس‌ها) حذف می‌شوند و حساب
 * به شکل ناشناس باقی می‌ماند تا یکپارچگی گفت‌وگوهای طرف مقابل حفظ شود.
 */
export async function DELETE(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    await parseBody(req, deleteAccountSchema);

    const photos = await prisma.profilePhoto.findMany({ where: { userId: me.id } });
    await Promise.all(photos.map((p) => deleteUpload(p.imageUrl)));

    await prisma.$transaction([
      prisma.profilePhoto.deleteMany({ where: { userId: me.id } }),
      prisma.profile.deleteMany({ where: { userId: me.id } }),
      prisma.token.deleteMany({ where: { userId: me.id } }),
      prisma.notification.deleteMany({ where: { userId: me.id } }),
      prisma.userAction.deleteMany({ where: { OR: [{ fromUserId: me.id }, { toUserId: me.id }] } }),
      prisma.match.updateMany({
        where: { OR: [{ userOneId: me.id }, { userTwoId: me.id }] },
        data: { status: 'UNMATCHED' },
      }),
      prisma.user.update({
        where: { id: me.id },
        data: {
          email: `deleted-${me.id}@hawre.invalid`,
          passwordHash: null,
          googleId: null,
          accountStatus: 'DELETED',
          emailVerified: false,
        },
      }),
    ]);

    destroySession();
    return ok({ message: 'حساب شما حذف شد. امیدواریم دوباره شما را ببینیم.' });
  });
}
