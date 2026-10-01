#!/usr/bin/env bash
# راه‌اندازی سریع هاوڕێ: در صورت نبودِ وابستگی‌ها یا دیتابیس، همه چیز را آماده و سرور را اجرا می‌کند.
# اجرا:  bash start.sh
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "▸ ساخت فایل .env از روی .env.example"
  cp .env.example .env
  echo "  ⚠ مقادیر AUTH_SECRET، ADMIN_PASSWORD و SEED_USER_PASSWORD را تنظیم کنید."
fi

if [[ ! -d node_modules ]] || [[ ! -d node_modules/next ]]; then
  echo "▸ نصب وابستگی‌ها…"
  npm install --no-audit --no-fund
fi

echo "▸ تولید Prisma Client…"
npx prisma generate >/dev/null

if [[ ! -f prisma/dev.db ]]; then
  echo "▸ ساخت دیتابیس و اعمال Migrationها…"
  npx prisma migrate deploy
  echo "▸ ساخت داده‌های آزمایشی…"
  npx tsx prisma/seed.ts
fi

echo "▸ اجرای سرور روی http://0.0.0.0:${PORT:-3000}"
exec npm run dev -- -H 0.0.0.0 -p "${PORT:-3000}"
