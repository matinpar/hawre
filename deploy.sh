#!/usr/bin/env bash
# ------------------------------------------------------------------
# راه‌اندازی کامل هاوڕێ روی سرور — یک دستور، از صفر تا HTTPS
#
#   bash deploy.sh yourdomain.com you@email.com
#
# کارهایی که انجام می‌دهد:
#   ۱) نصب Docker (در صورت نبود)
#   ۲) ساخت .env.production با کلیدهای تصادفی امن (اگر نبود)
#   ۳) بررسی آمادگی (preflight)
#   ۴) بالا آوردن برنامه + Nginx
#   ۵) گرفتن گواهی HTTPS از Let's Encrypt و فعال‌کردن آن
#   ۶) تنظیم تمدید خودکار گواهی و پشتیبان روزانه
# ------------------------------------------------------------------
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say() { echo -e "\n▸ $1"; }
die() { echo -e "\n✖ $1" >&2; exit 1; }

[[ -z "$DOMAIN" ]] && die "دامنه را بدهید:  bash deploy.sh example.com you@email.com"
[[ -z "$EMAIL" ]] && die "ایمیل برای Let's Encrypt را بدهید:  bash deploy.sh $DOMAIN you@email.com"

# ---------- ۱) Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  say "نصب Docker…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi
docker compose version >/dev/null 2>&1 || die "افزونه docker compose نصب نیست."
say "Docker آماده است: $(docker --version)"

# ---------- ۲) متغیرهای محیطی ----------
if [[ ! -f .env.production ]]; then
  say "ساخت .env.production با کلیدهای تصادفی…"
  SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  ADMIN_PASS="$(openssl rand -base64 18 | tr -d '\n/+=' | cut -c1-16)"
  cat > .env.production <<EOF
APP_URL="https://$DOMAIN"
AUTH_SECRET="$SECRET"
DATABASE_URL="file:/app/data/hawre.db"

# ورود با Google (اختیاری) — Redirect URI: https://$DOMAIN/api/auth/google/callback
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ایمیل تراکنشی (اختیاری ولی توصیه‌شده) — کلید رایگان از resend.com
RESEND_API_KEY=""
MAIL_FROM="هاوڕێ <noreply@$DOMAIN>"

# حساب مدیر
ADMIN_EMAIL="$EMAIL"
ADMIN_PASSWORD="$ADMIN_PASS"

ALLOW_TOKEN_FALLBACK="false"
COOKIE_CROSS_SITE="false"
ALLOWED_FRAME_ANCESTORS="'self'"
NODE_ENV="production"
EOF
  chmod 600 .env.production
  echo "   رمز مدیر ساخته شد: $ADMIN_PASS   ← همین حالا جایی امن ذخیره‌اش کنید"
else
  say "فایل .env.production از قبل موجود است (دست‌نخورده ماند)."
fi

# ---------- ۳) بررسی آمادگی ----------
say "بررسی آمادگی…"
set -a; . ./.env.production; set +a
bash scripts/preflight.sh || die "ایرادهای بالا را رفع و دوباره اجرا کنید."

# ---------- ۴) Nginx و بالا آوردن سرویس ----------
say "تنظیم Nginx برای دامنه $DOMAIN…"
sed -i "s/example\.com/$DOMAIN/g" docker/nginx.conf
# تا پیش از گرفتن گواهی، بلاک HTTPS موقتاً غیرفعال می‌شود
python3 - "$ROOT/docker/nginx.conf" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if 'listen 443 ssl;' in s and '#__TLS_OFF__' not in s:
    i = s.index('server {\n    listen 443 ssl;')
    head, tail = s[:i], s[i:]
    tail = '#__TLS_OFF__\n' + '\n'.join('#' + l if l.strip() else l for l in tail.split('\n'))
    open(p, 'w', encoding='utf-8').write(head + tail)
    print('   بلاک HTTPS موقتاً غیرفعال شد.')
PY

mkdir -p docker/certbot/www docker/certbot/conf
say "ساخت و اجرای کانتینرها…"
docker compose --profile proxy up -d --build

say "در انتظار سالم شدن برنامه…"
for i in $(seq 1 30); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "   برنامه سالم است."; break
  fi
  sleep 3
done

# ---------- ۵) گواهی HTTPS ----------
if [[ ! -d "docker/certbot/conf/live/$DOMAIN" ]]; then
  say "گرفتن گواهی HTTPS برای $DOMAIN…"
  docker run --rm \
    -v "$ROOT/docker/certbot/conf:/etc/letsencrypt" \
    -v "$ROOT/docker/certbot/www:/var/www/certbot" \
    certbot/certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --non-interactive \
    || die "گرفتن گواهی ناموفق بود. مطمئن شوید رکورد DNS دامنه به IP این سرور اشاره می‌کند و پورت ۸۰ باز است."
fi

say "فعال‌کردن HTTPS…"
python3 - "$ROOT/docker/nginx.conf" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
if '#__TLS_OFF__' in s:
    i = s.index('#__TLS_OFF__')
    head, tail = s[:i], s[i:].replace('#__TLS_OFF__\n', '', 1)
    tail = '\n'.join(l[1:] if l.startswith('#') else l for l in tail.split('\n'))
    open(p, 'w', encoding='utf-8').write(head + tail)
    print('   بلاک HTTPS فعال شد.')
PY
docker compose restart nginx

# ---------- ۶) تمدید خودکار و پشتیبان ----------
say "تنظیم تمدید خودکار گواهی و پشتیبان روزانه…"
CRON_RENEW="0 3 1 * * cd $ROOT && docker run --rm -v $ROOT/docker/certbot/conf:/etc/letsencrypt -v $ROOT/docker/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker compose restart nginx"
CRON_BACKUP="30 2 * * * cd $ROOT && bash scripts/backup.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'certbot/certbot renew' | grep -v 'scripts/backup.sh'; echo "$CRON_RENEW"; echo "$CRON_BACKUP" ) | crontab -

cat <<EOF

────────────────────────────────────────────
✅ هاوڕێ روی https://$DOMAIN بالا آمد.

ورود مدیر:  $EMAIL
رمز مدیر:   در فایل .env.production  (دستور: grep ADMIN_PASSWORD .env.production)

گام‌های اختیاری بعدی:
  • ایمیل واقعی:  کلید Resend را در .env.production بگذارید و  docker compose up -d  بزنید
  • ورود با Google: GOOGLE_CLIENT_ID و SECRET را اضافه کنید
  • فایروال:       ufw allow 80,443,22/tcp && ufw enable

دستورهای روزمره:
  docker compose logs -f app      # لاگ زنده
  docker compose up -d --build    # به‌روزرسانی پس از git pull
  bash scripts/backup.sh          # پشتیبان دستی
────────────────────────────────────────────
EOF
