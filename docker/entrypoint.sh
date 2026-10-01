#!/bin/sh
# نقطه ورود کانتینر هاوڕێ:
#   ۱) بررسی متغیرهای حیاتی
#   ۲) اجرای مهاجرت‌های دیتابیس
#   ۳) ساخت حساب مدیر در صورت تعریف ADMIN_EMAIL/ADMIN_PASSWORD
#   ۴) اجرای سرور
set -e

echo "▸ هاوڕێ — آماده‌سازی محیط اجرا"

if [ -z "$AUTH_SECRET" ] || [ ${#AUTH_SECRET} -lt 32 ]; then
  echo "✖ خطا: AUTH_SECRET تعریف نشده یا کمتر از ۳۲ کاراکتر است." >&2
  echo "  با دستور  openssl rand -base64 48  یک مقدار بسازید." >&2
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "✖ خطا: DATABASE_URL تعریف نشده است." >&2
  exit 1
fi

echo "▸ اجرای مهاجرت‌های دیتابیس…"
./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  echo "▸ بررسی/ساخت حساب مدیر ($ADMIN_EMAIL)…"
  node prisma/create-admin.js || echo "⚠ ساخت حساب مدیر انجام نشد (احتمالاً از قبل وجود دارد)."
fi

echo "▸ اجرای سرور روی پورت ${PORT:-3000}"
exec "$@"
