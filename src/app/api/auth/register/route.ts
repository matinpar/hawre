import { handle, ok, parseBody, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { hashPassword, issueToken, createSession, tokenFallbackEnabled } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/security';
import { sendVerificationEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    await rateLimit('register', clientIp(), 5, 15 * 60);
    const body = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new HttpError('این ایمیل قبلاً ثبت شده است. وارد شوید یا رمز عبور را بازیابی کنید.', 409);
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await hashPassword(body.password),
        authProvider: 'EMAIL',
        settings: { create: {} },
      },
      select: { id: true, email: true, role: true },
    });

    const token = await issueToken(user.id, 'VERIFY_EMAIL', 60 * 24);
    const verifyUrl = `${process.env.APP_URL ?? ''}/verify-email?token=${token}`;
    console.info(`[DEV] لینک تأیید ایمیل برای ${user.email}: ${verifyUrl}`);
    // ارسال واقعی ایمیل در صورت تنظیم بودن سرویس؛ در غیر این صورت فقط لاگ می‌شود
    await sendVerificationEmail(user.email, verifyUrl);

    const sessionToken = await createSession(user.id, user.role);

    return ok({
      user: { id: user.id, email: user.email },
      message: 'ثبت‌نام انجام شد. لینک تأیید ایمیل برای شما ارسال شد.',
      // در محیط توسعه لینک را برمی‌گردانیم تا بدون سرویس ایمیل قابل تست باشد
      devVerifyUrl: process.env.NODE_ENV === 'production' ? undefined : verifyUrl,
      sessionToken: tokenFallbackEnabled() ? sessionToken : undefined,
    }, 201);
  });
}
