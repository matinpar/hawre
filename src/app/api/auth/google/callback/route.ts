import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createSession, issueToken, tokenFallbackEnabled } from '@/lib/auth';
import { exchangeCode, googleConfigured } from '@/lib/google';

export const dynamic = 'force-dynamic';

function redirectWithError(message: string) {
  return NextResponse.redirect(`${process.env.APP_URL ?? ''}/login?error=${encodeURIComponent(message)}`);
}

export async function GET(req: Request) {
  if (!googleConfigured()) return redirectWithError('ورود با Google پیکربندی نشده است.');

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = cookies().get('hawre_oauth_state')?.value;
  cookies().set('hawre_oauth_state', '', { path: '/', maxAge: 0 });

  if (url.searchParams.get('error')) return redirectWithError('ورود با Google لغو شد.');
  if (!code || !state || state !== savedState) return redirectWithError('درخواست ورود با Google معتبر نیست.');

  let googleUser;
  try {
    googleUser = await exchangeCode(code);
  } catch {
    return redirectWithError('برقراری ارتباط با Google ناموفق بود. دوباره تلاش کنید.');
  }
  if (!googleUser.email) return redirectWithError('دسترسی به ایمیل حساب Google داده نشد.');

  const email = googleUser.email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: googleUser.sub }, { email }] },
    include: { profile: true, photos: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        googleId: googleUser.sub,
        authProvider: 'GOOGLE',
        emailVerified: Boolean(googleUser.email_verified),
        settings: { create: {} },
        ...(googleUser.picture
          ? { photos: { create: { imageUrl: googleUser.picture, isPrimary: true, sortOrder: 0 } } }
          : {}),
      },
      include: { profile: true, photos: true },
    });
  } else {
    // اتصال حساب Google به حساب ایمیلی موجود
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: googleUser.sub,
        emailVerified: true,
        authProvider: user.passwordHash ? 'BOTH' : 'GOOGLE',
        lastActiveAt: new Date(),
      },
      include: { profile: true, photos: true },
    });
  }

  if (user.accountStatus !== 'ACTIVE') return redirectWithError('این حساب غیرفعال شده است.');

  await createSession(user.id, user.role, true);
  const dest = user.profile?.profileCompleted ? '/discover' : '/onboarding';

  if (tokenFallbackEnabled()) {
    // کد یکبارمصرف کوتاه‌عمر تا کلاینت بتواند بدون اتکا به کوکی نشست بسازد
    const handoff = await issueToken(user.id, 'OAUTH_HANDOFF', 2);
    return NextResponse.redirect(
      `${process.env.APP_URL ?? ''}/oauth-complete?code=${handoff}&next=${encodeURIComponent(dest)}`,
    );
  }
  return NextResponse.redirect(`${process.env.APP_URL ?? ''}${dest}`);
}
