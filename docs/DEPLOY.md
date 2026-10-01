# راهنمای استقرار هاوڕێ روی سرور (Docker)

این راهنما برای اجرای نسخه Production روی هر VPS با Docker نوشته شده است (Ubuntu 22.04+ فرض شده).

---

## ۱. پیش‌نیاز سرور

```bash
# نصب Docker و افزونه Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version   # باید نسخه v2 را نشان دهد
```

حداقل منابع پیشنهادی: **۱ هسته CPU، ۱ گیگابایت RAM، ۵ گیگابایت دیسک**.

---

## ۲. دریافت کد و تنظیم متغیرها

```bash
git clone <آدرس-مخزن> hawre && cd hawre
cp .env.production.example .env.production
```

سپس `.env.production` را باز کنید و حتماً این‌ها را پر کنید:

| متغیر | توضیح |
|---|---|
| `APP_URL` | نشانی کامل سرویس، مثل `https://example.com` |
| `AUTH_SECRET` | **الزامی** — با `openssl rand -base64 48` بسازید (حداقل ۳۲ کاراکتر) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | حساب مدیر که در اولین اجرا ساخته می‌شود |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | اختیاری؛ اگر خالی بماند دکمه ورود با Google غیرفعال می‌شود |

> `DATABASE_URL` از قبل روی `file:/app/data/hawre.db` تنظیم شده و روی والیوم پایدار می‌نشیند؛ تغییرش ندهید مگر به Postgres مهاجرت کنید.

اگر ورود با Google می‌خواهید، در [Google Cloud Console](https://console.cloud.google.com/apis/credentials) یک OAuth Client از نوع Web بسازید و این Redirect URI را ثبت کنید:

```
https://example.com/api/auth/google/callback
```

---

## ۳. اجرا

```bash
docker compose up -d --build
docker compose logs -f app       # مشاهده لاگ
```

هنگام بالا آمدن، entrypoint این کارها را خودکار انجام می‌دهد:

1. اعتبارسنجی `AUTH_SECRET` و `DATABASE_URL` (در صورت نبود، کانتینر با پیام روشن متوقف می‌شود)
2. اجرای `prisma migrate deploy`
3. ساخت/ارتقای حساب مدیر از روی `ADMIN_EMAIL` و `ADMIN_PASSWORD`
4. اجرای سرور روی پورت ۳۰۰۰

بررسی سلامت:

```bash
curl http://localhost:3000/api/health
# {"ok":true,"data":{"status":"healthy", ...}}
```

---

## ۴. انتشار روی دامنه با HTTPS

فایل `docker/nginx.conf` را باز کنید و همه‌جا `example.com` را با دامنه خود جایگزین کنید.

**گام ۱ — فقط HTTP** (بلاک `listen 443` را موقتاً کامنت کنید) و سرویس پروکسی را بالا بیاورید:

```bash
docker compose --profile proxy up -d
```

**گام ۲ — دریافت گواهی رایگان Let's Encrypt:**

```bash
docker run --rm \
  -v "$PWD/docker/certbot/conf:/etc/letsencrypt" \
  -v "$PWD/docker/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot -d example.com
```

**گام ۳ —** بلاک `listen 443` را از کامنت خارج کنید و `docker compose restart nginx`.

**تمدید خودکار** (هر ماه):

```bash
0 3 1 * * cd /path/to/hawre && docker run --rm -v "$PWD/docker/certbot/conf:/etc/letsencrypt" -v "$PWD/docker/certbot/www:/var/www/certbot" certbot/certbot renew --quiet && docker compose restart nginx
```

پس از فعال شدن Nginx، خط `ports: - "3000:3000"` را از `docker-compose.yml` حذف کنید تا پورت برنامه مستقیماً روی اینترنت باز نباشد.

---

## ۴.۵ فعال‌سازی ارسال ایمیل (اختیاری ولی توصیه‌شده)

بدون این مرحله، برنامه کار می‌کند ولی لینک‌های تأیید و بازیابی فقط در لاگ سرور چاپ می‌شوند.

۱. در [resend.com](https://resend.com) حساب رایگان بسازید (۳٬۰۰۰ ایمیل در ماه، ۱۰۰ در روز).
۲. دامنه خود را در بخش Domains اضافه و رکوردهای DNS (SPF/DKIM) را ثبت کنید.
۳. یک API Key بسازید و در `.env.production` قرار دهید:

```bash
RESEND_API_KEY="re_..."
MAIL_FROM="هاوڕێ <noreply@example.com>"
```

۴. `docker compose up -d --build` و یک ثبت‌نام آزمایشی انجام دهید؛ در لاگ باید `[MAIL:SENT]` ببینید.

> برای تست سریع بدون دامنه می‌توانید از فرستنده پیش‌فرض `onboarding@resend.dev` استفاده کنید (فقط به ایمیل خودتان ارسال می‌شود).

---

## ۵. پشتیبان‌گیری و بازیابی

داده‌ها در دو والیوم هستند: `hawre-data` (دیتابیس) و `hawre-uploads` (عکس‌های کاربران).

```bash
# پشتیبان
docker run --rm -v hawre_hawre-data:/d -v "$PWD:/b" alpine tar czf /b/hawre-db-$(date +%F).tar.gz -C /d .
docker run --rm -v hawre_hawre-uploads:/d -v "$PWD:/b" alpine tar czf /b/hawre-uploads-$(date +%F).tar.gz -C /d .

# بازیابی
docker run --rm -v hawre_hawre-data:/d -v "$PWD:/b" alpine tar xzf /b/hawre-db-YYYY-MM-DD.tar.gz -C /d
```

---

## ۶. به‌روزرسانی نسخه

```bash
git pull
docker compose up -d --build     # مهاجرت‌ها خودکار اجرا می‌شوند
docker image prune -f
```

---

## ۷. سیاهه بررسی پیش از انتشار عمومی

- [ ] `AUTH_SECRET` تصادفی و یکتا است (نه مقدار نمونه)
- [ ] `ADMIN_PASSWORD` قوی است و فقط در `.env.production` قرار دارد
- [ ] `.env.production` در گیت commit نشده است (`.gitignore` پوشش می‌دهد)
- [ ] `ALLOW_TOKEN_FALLBACK="false"` و `COOKIE_CROSS_SITE="false"` (مگر اجرای داخل iframe)
- [ ] `ALLOWED_FRAME_ANCESTORS="'self'"`
- [ ] HTTPS فعال است و HTTP به آن هدایت می‌شود
- [ ] فایروال: فقط پورت‌های ۸۰، ۴۴۳ و SSH باز باشند (`ufw allow 80,443,22/tcp`)
- [ ] پشتیبان‌گیری زمان‌بندی‌شده تنظیم شده است
- [ ] `docker compose logs app` خطایی نشان نمی‌دهد و `/api/health` سالم است

---

## ۸. مهاجرت به PostgreSQL (اختیاری، برای ترافیک بالاتر)

SQLite برای این MVP کاملاً کافی است، اما اگر چند نمونه هم‌زمان می‌خواهید:

1. در `prisma/schema.prisma` مقدار `provider` را به `postgresql` تغییر دهید.
2. سرویس Postgres را به `docker-compose.yml` اضافه کنید و `DATABASE_URL` را روی
   `postgresql://user:pass@db:5432/hawre?schema=public` بگذارید.
3. مهاجرت‌ها را دوباره بسازید: `npx prisma migrate dev --name init-postgres`.

> توجه: مهاجرت‌های فعلی برای SQLite نوشته شده‌اند و مستقیماً روی Postgres اجرا نمی‌شوند.
