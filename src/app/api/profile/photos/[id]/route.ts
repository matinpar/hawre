import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { deleteUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

/** تعیین عکس اصلی */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const photo = await prisma.profilePhoto.findUnique({ where: { id: params.id } });
    if (!photo || photo.userId !== me.id) throw new HttpError('عکس موردنظر یافت نشد.', 404);
    await prisma.$transaction([
      prisma.profilePhoto.updateMany({ where: { userId: me.id }, data: { isPrimary: false } }),
      prisma.profilePhoto.update({ where: { id: photo.id }, data: { isPrimary: true } }),
    ]);
    return ok({ message: 'عکس اصلی به‌روزرسانی شد.' });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const photo = await prisma.profilePhoto.findUnique({ where: { id: params.id } });
    if (!photo || photo.userId !== me.id) throw new HttpError('عکس موردنظر یافت نشد.', 404);

    await prisma.profilePhoto.delete({ where: { id: photo.id } });
    await deleteUpload(photo.imageUrl);

    const remaining = await prisma.profilePhoto.findMany({ where: { userId: me.id }, orderBy: { sortOrder: 'asc' } });
    if (photo.isPrimary && remaining[0]) {
      await prisma.profilePhoto.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
    }
    if (remaining.length === 0) {
      await prisma.profile.updateMany({ where: { userId: me.id }, data: { profileCompleted: false } });
    }
    return ok({ message: 'عکس حذف شد.', remaining: remaining.length });
  });
}
