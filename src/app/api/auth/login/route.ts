import { handle, ok, parseBody, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { createSession, tokenFallbackEnabled, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/security';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await parseBody(req, loginSchema);
    await rateLimit('login-ip', clientIp(), 10, 10 * 60);
    await rateLimit('login-email', body.email, 5, 10 * 60);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { profile: { select: { profileCompleted: true } } },
    });

    // پیام یکسان برای جلوگیری از افشای وجود حساب
    const invalid = new HttpError('ایمیل یا رمز عبور نادرست است.', 401);
    if (!user || !user.passwordHash) throw invalid;
    if (user.accountStatus !== 'ACTIVE') {
      throw new HttpError('این حساب غیرفعال شده است. با پشتیبانی تماس بگیرید.', 403);
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw invalid;

    const sessionToken = await createSession(user.id, user.role, body.remember);
    if (process.env.NODE_ENV !== 'production') {
      const h = headers();
      console.info(`[DEV] ورود موفق ${user.email} | host=${h.get('host')} | proto=${h.get('x-forwarded-proto') ?? '-'}`);
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    return ok({
      user: { id: user.id, email: user.email, role: user.role },
      profileCompleted: Boolean(user.profile?.profileCompleted),
      sessionToken: tokenFallbackEnabled() ? sessionToken : undefined,
    });
  });
}
