import { z } from 'zod';
import { handle, ok, parseBody, requireAdmin, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { deleteUpload } from '@/lib/storage';
import { sanitizeText } from '@/lib/security';
import { sendVerificationResultEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { message: 'اقدام نامعتبر است.' }),
  note: z.string().max(300).optional(),
});

/** تأیید یا رد درخواست تأیید هویت؛ سلفی پس از بررسی بلافاصله حذف می‌شود */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const admin = await requireAdmin();
    const body = await parseBody(req, reviewSchema);

    const record = await prisma.verification.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, emailVerified: true } } },
    });
    if (!record) throw new HttpError('درخواست یافت نشد.', 404);

    const approved = body.action === 'APPROVE';
    const note = sanitizeText(body.note ?? '').slice(0, 300);

    await prisma.$transaction([
      prisma.verification.update({
        where: { id: record.id },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          note,
          reviewedAt: new Date(),
          reviewerId: admin.id,
          selfieUrl: null, // مدرک هویتی پس از بررسی نگه داشته نمی‌شود
        },
      }),
      prisma.profile.update({ where: { userId: record.userId }, data: { isVerified: approved } }),
      prisma.notification.create({
        data: {
          userId: record.userId,
          type: 'VERIFICATION',
          title: approved ? 'پروفایل شما تأیید شد' : 'درخواست تأیید هویت پذیرفته نشد',
          body: approved ? 'نشان تأییدشده کنار نام شما نمایش داده می‌شود.' : note || 'می‌توانید دوباره تلاش کنید.',
        },
      }),
    ]);

    // حذف فیزیکی فایل سلفی
    if (record.selfieUrl) await deleteUpload(record.selfieUrl);

    if (record.user.emailVerified) {
      await sendVerificationResultEmail(record.user.email, approved, note || undefined);
    }

    return ok({ message: approved ? 'پروفایل تأیید شد.' : 'درخواست رد شد.', status: approved ? 'APPROVED' : 'REJECTED' });
  });
}
