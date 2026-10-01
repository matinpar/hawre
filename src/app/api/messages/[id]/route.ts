import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** حذف نرم پیام — فقط فرستنده مجاز است */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const msg = await prisma.message.findUnique({ where: { id: params.id } });
    if (!msg || msg.senderId !== me.id) throw new HttpError('پیام یافت نشد.', 404);
    await prisma.message.update({ where: { id: msg.id }, data: { deletedAt: new Date() } });
    return ok({ message: 'پیام حذف شد.' });
  });
}
