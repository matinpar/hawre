import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { saveUpload, deleteUpload } from '@/lib/storage';
import { rateLimit } from '@/lib/security';
import { VERIFICATION_GESTURES, pickGesture } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/** وضعیت تأیید هویت من + ژست خواسته‌شده */
export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    const record = await prisma.verification.findUnique({ where: { userId: me.id } });

    return ok({
      status: record?.status ?? 'NONE',
      // ژست پایدار بر اساس شناسه کاربر تا با هر بار باز کردن صفحه عوض نشود
      gesture: record?.gesture ?? pickGesture(me.id),
      note: record?.note ?? '',
      createdAt: record?.createdAt.toISOString() ?? null,
      reviewedAt: record?.reviewedAt?.toISOString() ?? null,
      isVerified: me.profile?.isVerified ?? false,
      gestures: VERIFICATION_GESTURES,
    });
  });
}

/** ارسال سلفی ژست‌دار برای بررسی دستی مدیر */
export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('verification', me.id, 5, 24 * 60 * 60);

    if (!me.profile?.profileCompleted) {
      throw new HttpError('ابتدا پروفایل خود را کامل کنید.', 403);
    }
    if (me.profile.isVerified) throw new HttpError('پروفایل شما از قبل تأیید شده است.', 409);

    const existing = await prisma.verification.findUnique({ where: { userId: me.id } });
    if (existing?.status === 'PENDING') {
      throw new HttpError('درخواست شما در صف بررسی است. لطفاً منتظر بمانید.', 409);
    }

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) throw new HttpError('فایلی ارسال نشده است.', 400);

    const selfieUrl = await saveUpload(file, `vrf-${me.id}`);
    if (existing?.selfieUrl) await deleteUpload(existing.selfieUrl);

    const gesture = existing?.gesture ?? pickGesture(me.id);
    const record = await prisma.verification.upsert({
      where: { userId: me.id },
      create: { userId: me.id, gesture, selfieUrl, status: 'PENDING' },
      update: { selfieUrl, status: 'PENDING', note: '', reviewedAt: null, reviewerId: null, createdAt: new Date() },
    });

    return ok(
      {
        status: record.status,
        gesture: record.gesture,
        message: 'تصویر شما ارسال شد و در صف بررسی قرار گرفت. نتیجه از طریق ایمیل اطلاع داده می‌شود.',
      },
      201,
    );
  });
}

/** انصراف از درخواست در حال بررسی */
export async function DELETE() {
  return handle(async () => {
    const me = await requireUser();
    const record = await prisma.verification.findUnique({ where: { userId: me.id } });
    if (!record) throw new HttpError('درخواستی برای لغو وجود ندارد.', 404);
    if (record.selfieUrl) await deleteUpload(record.selfieUrl);
    await prisma.verification.delete({ where: { userId: me.id } });
    return ok({ message: 'درخواست تأیید هویت لغو و تصویر شما حذف شد.' });
  });
}
