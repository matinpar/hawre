import { handle, ok, parseBody, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { consumeToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const { token } = await parseBody(req, z.object({ token: z.string().min(10, 'لینک نامعتبر است.') }));
    const userId = await consumeToken(token, 'VERIFY_EMAIL');
    if (!userId) throw new HttpError('لینک تأیید نامعتبر یا منقضی شده است.', 400);
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return ok({ message: 'ایمیل شما با موفقیت تأیید شد.' });
  });
}
