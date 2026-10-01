import { handle, ok, parseBody, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { consumeToken, createSession, tokenFallbackEnabled } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * تبدیل کد یکبارمصرفِ بازگشتی از Google به نشست.
 * این مسیر برای محیط‌هایی لازم است که کوکی شخص‌ثالث مسدود می‌شود و کلاینت باید
 * توکن نشست را خودش نگه دارد.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const { code } = await parseBody(req, z.object({ code: z.string().min(10, 'کد نامعتبر است.') }));
    const userId = await consumeToken(code, 'OAUTH_HANDOFF');
    if (!userId) throw new HttpError('کد ورود نامعتبر یا منقضی شده است. دوباره تلاش کنید.', 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accountStatus: true, profile: { select: { profileCompleted: true } } },
    });
    if (!user || user.accountStatus !== 'ACTIVE') throw new HttpError('این حساب در دسترس نیست.', 403);

    const sessionToken = await createSession(user.id, user.role, true);
    return ok({
      profileCompleted: Boolean(user.profile?.profileCompleted),
      sessionToken: tokenFallbackEnabled() ? sessionToken : undefined,
    });
  });
}
