import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * توجه: نشست می‌تواند به‌جای کوکی، با توکن ذخیره‌شده در مرورگر برقرار باشد
 * (برای محیط‌هایی که کوکی شخص‌ثالث مسدود است). چون Middleware به آن دسترسی ندارد،
 * محافظت صفحات سمت کلاینت (AppFrame) انجام می‌شود و کنترل اصلی دسترسی روی
 * تک‌تک APIها در سرور اعمال می‌گردد.
 */
const GUEST_ONLY = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('hawre_session')?.value;

  let valid = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (valid && GUEST_ONLY.includes(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/discover';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico).*)'],
};
