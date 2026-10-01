# راه‌اندازی واقعی هاوڕێ روی سرور 🚀

این سند فرض می‌کند یک سرور لینوکسی (Ubuntu 22.04+) و یک دامنه دارید.
کل کار با **یک دستور** انجام می‌شود.

---

## گام ۰ — دامنه را به سرور وصل کنید

در پنل دامنه، یک رکورد **A** بسازید:

| نوع | نام | مقدار |
|---|---|---|
| A | `@` | IP سرور شما |
| A | `www` | IP سرور شما |

تا پخش‌شدن DNS ۵ تا ۳۰ دقیقه صبر کنید. بررسی: `ping yourdomain.com`

---

## گام ۱ — ورود به سرور و گرفتن کد

```bash
ssh root@IP-سرور

apt update && apt install -y git
git clone https://github.com/matinpar/hawre.git
cd hawre
```

---

## گام ۲ — یک دستور، تا HTTPS

```bash
bash deploy.sh yourdomain.com you@email.com
```

این اسکریپت خودش:
1. Docker را نصب می‌کند (اگر نباشد)
2. `.env.production` را با **`AUTH_SECRET` تصادفی ۴۸ بایتی** و **رمز مدیر تصادفی** می‌سازد
3. بررسی آمادگی (`preflight`) را اجرا می‌کند و اگر ایرادی بود جلوی انتشار را می‌گیرد
4. برنامه + Nginx را بالا می‌آورد
5. گواهی **HTTPS رایگان Let's Encrypt** می‌گیرد و فعال می‌کند
6. **تمدید خودکار گواهی** و **پشتیبان روزانه** را روی cron می‌گذارد

در پایان، رمز مدیر را چاپ می‌کند — جایی امن ذخیره‌اش کنید.

---

## گام ۳ — دو سرویس اختیاری ولی مهم

### الف) ایمیل واقعی (تأیید حساب و بازیابی رمز)
بدون آن، کاربر نمی‌تواند ایمیلش را تأیید یا رمزش را بازیابی کند.

1. در [resend.com](https://resend.com) حساب رایگان بسازید (۳٬۰۰۰ ایمیل در ماه)
2. دامنه‌تان را Add Domain کنید و رکوردهای **SPF/DKIM** را در پنل دامنه ثبت کنید
3. یک API Key بسازید و در `.env.production` بگذارید:
```bash
RESEND_API_KEY="re_..."
MAIL_FROM="هاوڕێ <noreply@yourdomain.com>"
```
4. `docker compose up -d`

### ب) ورود با Google
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth client ID → Web application**
2. در **Authorized redirect URIs** دقیقاً این را بگذارید:
   `https://yourdomain.com/api/auth/google/callback`
3. مقادیر را در `.env.production` بگذارید و `docker compose up -d`

---

## گام ۴ — امن‌سازی سرور

```bash
ufw allow 22,80,443/tcp && ufw --force enable     # فایروال
adduser hawre && usermod -aG sudo,docker hawre     # کاربر غیر root
# سپس در /etc/ssh/sshd_config:  PermitRootLogin no  و  PasswordAuthentication no
systemctl restart ssh
```

---

## چه چیزی در این نسخه تغییر کرد (پایان حالت آزمایشی)

| قبل | حالا |
|---|---|
| برچسب «نسخه آزمایشی» در صفحه نخست، ورود و قوانین | متن‌های واقعی محصول |
| `robots.txt` کل سایت را مسدود می‌کرد | صفحات عمومی **ایندکس می‌شوند**، صفحات خصوصی مسدود |
| `metadataBase` تنظیم نشده بود | از `APP_URL` خوانده می‌شود (کارت اشتراک‌گذاری درست) |
| seed قابل اجرا روی هر محیطی | **اجرای seed در Production مسدود شد** |
| بدون بررسی پیش از انتشار | `scripts/preflight.sh` با ۲۰ سنجه |
| پشتیبان دستی | `scripts/backup.sh` + cron روزانه + نگه‌داری ۱۴ نسخه |
| راه‌اندازی چندمرحله‌ای | `deploy.sh` یک‌دستوری تا HTTPS |

---

## دستورهای روزمره

```bash
docker compose logs -f app         # لاگ زنده
docker compose ps                  # وضعیت سرویس‌ها
curl https://yourdomain.com/api/health

git pull && docker compose up -d --build   # به‌روزرسانی نسخه
bash scripts/backup.sh                     # پشتیبان دستی
docker compose down                        # توقف
```

### بازیابی از پشتیبان
```bash
docker compose down
docker run --rm -v hawre_hawre-data:/d -v "$PWD/backups":/b alpine \
  tar xzf /b/db-YYYY-MM-DD-HHMM.tar.gz -C /d
docker compose up -d
```

---

## سیاهه نهایی پیش از اعلام عمومی

- [ ] `bash scripts/preflight.sh` بدون ایراد
- [ ] ثبت‌نام با ایمیل واقعی تست شد و ایمیل تأیید رسید
- [ ] بازیابی رمز تست شد
- [ ] ورود با Google تست شد (اگر فعال است)
- [ ] آپلود عکس و ساخت پروفایل تست شد
- [ ] یک Match و یک گفت‌وگو تست شد
- [ ] ورود به `/admin` با حساب مدیر و دیدن آمار
- [ ] گزارش یک کاربر و بررسی آن در پنل
- [ ] `https://yourdomain.com` بدون هشدار گواهی باز می‌شود
- [ ] پشتیبان‌گیری یک‌بار دستی اجرا و فایلش بررسی شد
- [ ] رمز مدیر در جای امن ذخیره شد و از `.env.production` بیرون نرفته

---

هاوڕێ (Hawre) — ساخته شده توسط **عبدالمتین پرچین**
