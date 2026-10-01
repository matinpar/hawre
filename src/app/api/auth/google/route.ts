import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { googleConfigured, googleAuthUrl } from '@/lib/google';
import { cookieOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      `${process.env.APP_URL ?? ''}/login?error=${encodeURIComponent(
        'ورود با Google پیکربندی نشده است. مقادیر GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET را در فایل .env تنظیم کنید.',
      )}`,
    );
  }
  const state = crypto.randomBytes(16).toString('hex');
  cookies().set('hawre_oauth_state', state, cookieOptions(600));
  return NextResponse.redirect(googleAuthUrl(state));
}
