import { handle, ok, parseBody } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { issueToken } from '@/lib/auth';
import { forgotPasswordSchema } from '@/lib/validation';
import { clientIp, rateLimit } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    await rateLimit('forgot', clientIp(), 5, 15 * 60);
    const { email } = await parseBody(req, forgotPasswordSchema);
    const user = await prisma.user.findUnique({ where: { email } });

    let devResetUrl: string | undefined;
    if (user && user.accountStatus === 'ACTIVE') {
      const token = await issueToken(user.id, 'RESET_PASSWORD', 60);
      const url = `${process.env.APP_URL ?? ''}/reset-password?token=${token}`;
      console.info(`[DEV] لینک بازیابی رمز برای ${email}: ${url}`);
      await sendPasswordResetEmail(email, url);
      if (process.env.NODE_ENV !== 'production') devResetUrl = url;
    }

    // پاسخ همیشه یکسان است تا وجود/عدم وجود حساب فاش نشود
    return ok({
      message: 'اگر این ایمیل در سامانه ثبت شده باشد، لینک بازیابی برای آن ارسال می‌شود.',
      devResetUrl,
    });
  });
}
