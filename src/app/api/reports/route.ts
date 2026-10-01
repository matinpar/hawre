import { handle, ok, parseBody, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { reportSchema } from '@/lib/validation';
import { rateLimit, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('report', me.id, 10, 60 * 60);
    const body = await parseBody(req, reportSchema);
    if (body.reportedUserId === me.id) throw new HttpError('نمی‌توانید خودتان را گزارش کنید.', 400);

    const target = await prisma.user.findUnique({ where: { id: body.reportedUserId }, select: { id: true } });
    if (!target) throw new HttpError('کاربر گزارش‌شونده یافت نشد.', 404);

    await prisma.report.create({
      data: {
        reporterId: me.id,
        reportedUserId: body.reportedUserId,
        reason: body.reason,
        description: sanitizeText(body.description ?? ''),
      },
    });
    return ok({ message: 'گزارش شما ثبت شد. تیم پشتیبانی آن را بررسی می‌کند.' }, 201);
  });
}
