import { handle, ok, parseBody, requireAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { REPORT_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireAdmin();
    const { status, action } = await parseBody(
      req,
      z.object({
        status: z.enum(REPORT_STATUSES).optional(),
        action: z.enum(['DISABLE_USER', 'REMOVE_PHOTOS', 'REMOVE_BIO']).optional(),
      }),
    );

    const report = await prisma.report.findUnique({ where: { id: params.id } });
    if (!report) return ok({ message: 'گزارش یافت نشد.' }, 404);

    if (action === 'DISABLE_USER') {
      await prisma.user.update({ where: { id: report.reportedUserId }, data: { accountStatus: 'DISABLED' } });
    }
    if (action === 'REMOVE_PHOTOS') {
      await prisma.profilePhoto.deleteMany({ where: { userId: report.reportedUserId } });
      await prisma.profile.updateMany({ where: { userId: report.reportedUserId }, data: { profileCompleted: false } });
    }
    if (action === 'REMOVE_BIO') {
      await prisma.profile.updateMany({ where: { userId: report.reportedUserId }, data: { bio: '' } });
    }

    const updated = await prisma.report.update({
      where: { id: params.id },
      data: { status: status ?? 'REVIEWING' },
      select: { id: true, status: true },
    });
    return ok({ report: updated, message: 'گزارش به‌روزرسانی شد.' });
  });
}
