#!/usr/bin/env bash
# بررسی آمادگی برای Production — پیش از بالا آوردن سرویس اجرا کنید:
#   set -a; . ./.env.production; set +a; bash scripts/preflight.sh
set -uo pipefail

PASS=0; FAIL=0; WARN=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN+1)); }

echo "──────────────────────────────"
echo "بررسی آمادگی انتشار — هاوڕێ"
echo "──────────────────────────────"

echo "▶ ۱) متغیرهای حیاتی"
if [[ -z "${AUTH_SECRET:-}" ]]; then bad "AUTH_SECRET تعریف نشده است."
elif (( ${#AUTH_SECRET} < 32 )); then bad "AUTH_SECRET کوتاه است (${#AUTH_SECRET} کاراکتر، حداقل ۳۲)."
elif [[ "$AUTH_SECRET" == *"placeholder"* || "$AUTH_SECRET" == *"change"* ]]; then bad "AUTH_SECRET هنوز مقدار نمونه است."
else ok "AUTH_SECRET معتبر است (${#AUTH_SECRET} کاراکتر)."; fi

if [[ -z "${DATABASE_URL:-}" ]]; then bad "DATABASE_URL تعریف نشده است."; else ok "DATABASE_URL: $DATABASE_URL"; fi

if [[ -z "${APP_URL:-}" ]]; then bad "APP_URL تعریف نشده است."
elif [[ "$APP_URL" != https://* ]]; then warn "APP_URL با https شروع نمی‌شود: $APP_URL"
elif [[ "$APP_URL" == *localhost* ]]; then bad "APP_URL هنوز روی localhost است."
else ok "APP_URL: $APP_URL"; fi

echo "▶ ۲) حساب مدیر"
if [[ -z "${ADMIN_EMAIL:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  warn "ADMIN_EMAIL/ADMIN_PASSWORD تعریف نشده‌اند (حساب مدیر ساخته نمی‌شود)."
else
  if (( ${#ADMIN_PASSWORD} < 12 )); then warn "رمز مدیر کوتاه است (${#ADMIN_PASSWORD}); حداقل ۱۲ کاراکتر توصیه می‌شود."
  else ok "رمز مدیر مناسب است."; fi
  [[ "$ADMIN_PASSWORD" == "Admin12345!" ]] && bad "رمز مدیر همان رمز نمونه است — حتماً عوض کنید."
  ok "حساب مدیر: $ADMIN_EMAIL"
fi

echo "▶ ۳) ایمیل تراکنشی"
if [[ -z "${RESEND_API_KEY:-}" ]]; then
  warn "RESEND_API_KEY تعریف نشده: تأیید ایمیل و بازیابی رمز ارسال نمی‌شوند (فقط در لاگ چاپ می‌شوند)."
else
  ok "کلید Resend تنظیم شده است."
  [[ "${MAIL_FROM:-}" == *"resend.dev"* ]] && warn "MAIL_FROM روی دامنه آزمایشی resend.dev است؛ دامنه خودتان را تأیید کنید."
fi

echo "▶ ۴) ورود با Google"
if [[ -z "${GOOGLE_CLIENT_ID:-}" || -z "${GOOGLE_CLIENT_SECRET:-}" ]]; then
  warn "Google OAuth تنظیم نشده — دکمه ورود با Google غیرفعال می‌ماند (ورود با ایمیل کار می‌کند)."
else
  ok "Google OAuth تنظیم شده است."
  echo "     Redirect URI باید دقیقاً این باشد: ${APP_URL:-?}/api/auth/google/callback"
fi

echo "▶ ۵) تنظیمات امنیتی"
[[ "${ALLOW_TOKEN_FALLBACK:-false}" == "true" ]] && warn "ALLOW_TOKEN_FALLBACK=true (فقط برای اجرا داخل iframe لازم است)." || ok "ALLOW_TOKEN_FALLBACK خاموش است."
[[ "${COOKIE_CROSS_SITE:-false}" == "true" ]] && warn "COOKIE_CROSS_SITE=true (کوکی بین‌دامنه‌ای)." || ok "کوکی فقط same-site است."
[[ "${NODE_ENV:-}" == "production" ]] && ok "NODE_ENV=production" || warn "NODE_ENV روی production نیست (مقدار فعلی: ${NODE_ENV:-خالی})."
[[ "${ALLOWED_FRAME_ANCESTORS:-\'self\'}" == *"self"* ]] && ok "frame-ancestors محدود است." || warn "ALLOWED_FRAME_ANCESTORS باز است: ${ALLOWED_FRAME_ANCESTORS:-}"

echo "▶ ۶) فایل‌ها"
[[ -f .env.production ]] && ok "فایل .env.production موجود است." || warn ".env.production پیدا نشد."
if git rev-parse --git-dir >/dev/null 2>&1; then
  if git ls-files --error-unmatch .env.production >/dev/null 2>&1; then bad ".env.production در گیت commit شده — فوراً حذفش کنید!"
  else ok ".env.production در گیت نیست."; fi
fi
[[ -d prisma/migrations ]] && ok "مهاجرت‌های دیتابیس موجودند." || bad "پوشه prisma/migrations پیدا نشد."

echo
echo "──────────────────────────────"
echo "موفق: $PASS    هشدار: $WARN    ایراد: $FAIL"
echo "──────────────────────────────"
if (( FAIL > 0 )); then
  echo "⛔ تا رفع ایرادها سرویس را منتشر نکنید."
  exit 1
fi
echo "✅ آماده انتشار."
