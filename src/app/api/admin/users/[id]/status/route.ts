import { handle, ok, parseBody, requireAdmin, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ACCOUNT_STATUSES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { accountStatus } = await parseBody(
      req,
      z.object({ accountStatus: z.enum(ACCOUNT_STATUSES, { message: 'وضعیت نامعتبر است.' }) }),
    );
    if (params.id === admin.id) throw new HttpError('نمی‌توانید وضعیت حساب خودتان را تغییر دهید.', 400);
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { accountStatus },
      select: { id: true, accountStatus: true },
    });
    return ok({ user, message: 'وضعیت حساب به‌روزرسانی شد.' });
  });
}
