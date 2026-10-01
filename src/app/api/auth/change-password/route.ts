import { handle, ok, parseBody, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('change-password', me.id, 5, 15 * 60);
    const body = await parseBody(req, changePasswordSchema);

    const record = await prisma.user.findUnique({ where: { id: me.id }, select: { passwordHash: true, googleId: true } });

    if (record?.passwordHash) {
      if (!body.currentPassword) throw new HttpError('رمز عبور فعلی را وارد کنید.', 400);
      const valid = await verifyPassword(body.currentPassword, record.passwordHash);
      if (!valid) throw new HttpError('رمز عبور فعلی نادرست است.', 401);
    }

    await prisma.user.update({
      where: { id: me.id },
      data: {
        passwordHash: await hashPassword(body.newPassword),
        authProvider: record?.googleId ? 'BOTH' : 'EMAIL',
      },
    });
    return ok({ message: 'رمز عبور با موفقیت تغییر کرد.' });
  });
}
