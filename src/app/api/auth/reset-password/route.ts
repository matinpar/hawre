import { handle, ok, parseBody, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { consumeToken, hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    await rateLimit('reset', clientIp(), 10, 15 * 60);
    const body = await parseBody(req, resetPasswordSchema);
    const userId = await consumeToken(body.token, 'RESET_PASSWORD');
    if (!userId) throw new HttpError('لینک بازیابی نامعتبر یا منقضی شده است.', 400);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(body.password),
        authProvider: (await prisma.user.findUnique({ where: { id: userId }, select: { googleId: true } }))?.googleId
          ? 'BOTH'
          : 'EMAIL',
      },
    });
    return ok({ message: 'رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.' });
  });
}
