# مستندات API هاوڕێ

قالب پاسخ در همه Endpointها:

```jsonc
// موفق
{ "ok": true, "data": { /* … */ } }
// ناموفق
{ "ok": false, "error": "پیام خطا به زبان فارسی" }
```

کدهای وضعیت پرکاربرد: `200` موفق، `201` ساخته شد، `401` نیاز به ورود، `403` عدم دسترسی،
`404` یافت نشد، `409` تعارض (تکراری)، `413` حجم زیاد، `415` نوع فایل غیرمجاز،
`422` داده نامعتبر، `429` درخواست بیش از حد، `500` خطای سرور.

### احراز هویت (دوحالته)

۱. **حالت اصلی — کوکی:** کوکی **HttpOnly** به نام `hawre_session` (JWT/HS256). کلاینت نیازی به هدر Authorization ندارد.

۲. **حالت جایگزین — توکن Bearer:** اگر مرورگر کوکی را بلاک کند (اجرا داخل iframe با دامنه متفاوت)،
همان JWT در بدنه پاسخ `login` / `register` / `oauth-exchange` در فیلد `sessionToken` نیز برگردانده می‌شود.
کلاینت آن را نگه می‌دارد (به‌ترتیب `localStorage` ← `sessionStorage` ← حافظه موقتِ صفحه) و در هدر
`Authorization: Bearer <token>` می‌فرستد. این حالت با `tokenFallbackEnabled()` کنترل می‌شود
(متغیر محیطی `ALLOW_TOKEN_FALLBACK`؛ پیش‌فرض `true` در توسعه و `false` در Production).
وقتی غیرفعال باشد، سرور هیچ `sessionToken` برنمی‌گرداند و هدر Bearer را نادیده می‌گیرد.

---

## جدول سطح دسترسی و داده‌های بازگشتی

| Endpoint | متد | دسترسی | داده‌های بازگشتی (مجاز) | محدودیت نرخ |
|---|---|---|---|---|
| `/api/auth/register` | POST | عمومی | `user{id,email}`، پیام، `devVerifyUrl` (فقط غیر-Production) | ۵ / ۱۵دقیقه / IP |
| `/api/auth/login` | POST | عمومی | `user{id,email,role}`, `profileCompleted`, `sessionToken`* | ۱۰/۱۰دقیقه IP، ۵/۱۰دقیقه ایمیل |
| `/api/auth/logout` | POST | عمومی | پیام | — |
| `/api/auth/me` | GET | عمومی | `user` یا `null` — بدون passwordHash/googleId | — |
| `/api/auth/verify-email` | POST | عمومی (با توکن) | پیام | — |
| `/api/auth/forgot-password` | POST | عمومی | پیام یکسان (عدم افشای وجود حساب)، `devResetUrl` در توسعه | ۵ / ۱۵دقیقه |
| `/api/auth/reset-password` | POST | عمومی (با توکن) | پیام | ۱۰ / ۱۵دقیقه |
| `/api/auth/change-password` | POST | کاربر واردشده | پیام | ۵ / ۱۵دقیقه |
| `/api/auth/google` | GET | عمومی | ریدایرکت به Google (با `state`) | — |
| `/api/auth/google/callback` | GET | عمومی | ریدایرکت به `/discover`، `/onboarding` یا `/oauth-complete?code=…` | — |
| `/api/auth/oauth-exchange` | POST | عمومی (با کد یک‌بارمصرف) | `user`, `profileCompleted`, `sessionToken`* | — |
> \* فیلد `sessionToken` تنها وقتی برگردانده می‌شود که حالت جایگزین فعال باشد (`ALLOW_TOKEN_FALLBACK`).

| `/api/profile/me` | GET | کاربر واردشده | پروفایل خود + عکس‌ها + ایمیل خود + تنظیمات | — |
| `/api/profile/me` | PUT | کاربر واردشده | پروفایل ذخیره‌شده، `needsPhoto` | — |
| `/api/profile/me` | PATCH | کاربر واردشده | پروفایل به‌روزشده | — |
| `/api/profile/photos` | POST (multipart) | کاربر واردشده | `photo{id,url,isPrimary}` | ۲۰ / ساعت |
| `/api/profile/photos/:id` | PATCH | مالک عکس | پیام (تعیین عکس اصلی) | — |
| `/api/profile/photos/:id` | DELETE | مالک عکس | پیام، تعداد باقی‌مانده | — |
| `/api/profiles/discover` | GET | پروفایل کامل‌شده | آرایه `PublicProfile` | — |
| `/api/profiles/:id` | GET | کاربر واردشده و مسدودنشده | یک `PublicProfile` | — |
| `/api/actions/like` | POST | پروفایل کامل‌شده | `matched`, `matchId`, `profile` (در صورت Match) | ۳۰۰ / ساعت |
| `/api/actions/pass` | POST | پروفایل کامل‌شده | `matched:false` | ۳۰۰ / ساعت |
| `/api/actions/undo` | POST | پروفایل کامل‌شده | پیام، `restoredUserId` | — |
| `/api/actions/history` | GET | کاربر واردشده | ۱۰۰ انتخاب اخیرِ خودِ کاربر | — |
| `/api/matches` | GET | کاربر واردشده | فهرست Matchها + آخرین پیام + شمارنده خوانده‌نشده | — |
| `/api/matches/:id` | GET | عضو همان Match | اطلاعات Match + `PublicProfile` طرف مقابل | — |
| `/api/matches/:id` | DELETE | عضو همان Match | پیام (وضعیت → `UNMATCHED`) | — |
| `/api/matches/:id/messages` | GET | عضو همان Match | ۲۰۰ پیام آخر (+ علامت‌گذاری خوانده‌شده) | — |
| `/api/matches/:id/messages` | POST | عضو همان Match | پیام ساخته‌شده (پاک‌سازی‌شده) | ۶۰ / دقیقه |
| `/api/messages/:id/read` | PATCH | گیرنده پیام | پیام | — |
| `/api/messages/:id` | DELETE | فرستنده پیام | پیام (حذف نرم) | — |
| `/api/users/:id/block` | POST | کاربر واردشده | پیام (+ غیرفعال‌سازی Match) | — |
| `/api/users/:id/block` | DELETE | کاربر واردشده | پیام | — |
| `/api/reports` | POST | کاربر واردشده | پیام | ۱۰ / ساعت |
| `/api/settings` | GET | کاربر واردشده | تنظیمات + ایمیل خود | — |
| `/api/settings` | PATCH | کاربر واردشده | تنظیمات به‌روزشده | — |
| `/api/account` | DELETE | کاربر واردشده (با تأیید متنی) | پیام + ابطال نشست | — |
| `/api/admin/stats` | GET | **ADMIN** | آمار تجمیعی (بدون داده شخصی) | — |
| `/api/admin/users` | GET | **ADMIN** | فهرست کاربران بدون نمایش رمز؛ ایمیل فقط برای جست‌وجوی مدیر | — |
| `/api/admin/users/:id/status` | PATCH | **ADMIN** | وضعیت جدید حساب | — |
| `/api/admin/reports` | GET | **ADMIN** | گزارش‌ها + نام گزارش‌دهنده/گزارش‌شونده | — |
| `/api/admin/reports/:id` | PATCH | **ADMIN** | گزارش به‌روزشده (+ اقدام اختیاری) | — |

> نقش `ADMIN` همیشه از رکورد پایگاه داده خوانده می‌شود، نه صرفاً از محتوای توکن.

---

## شکل داده عمومی پروفایل (`PublicProfile`)

```ts
{
  userId: string;
  displayName: string;
  age: number;            // از birthDate محاسبه می‌شود؛ خود تاریخ تولد ارسال نمی‌شود
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  city: string;
  bio: string;
  interests: string[];
  photos: { id: string; url: string; isPrimary: boolean }[];
  distanceKm: number | null;   // تقریبی؛ در صورت خاموش بودن نمایش فاصله = null
  lastActiveAt?: string;
}
```

هرگز بازگردانده نمی‌شود: `email`، `passwordHash`، `googleId`، `role`، `accountStatus`، `settings`، `birthDate` خام.

---

## نمونه‌ها

### ثبت‌نام
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","password":"Test12345","confirmPassword":"Test12345","acceptTerms":true}'
```

### ورود و نگه‌داشتن کوکی
```bash
curl -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","password":"Test12345","remember":true}'
```

### ذخیره پروفایل
```bash
curl -b jar.txt -X PUT http://localhost:3000/api/profile/me \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"سارا","birthDate":"1996-02-20","gender":"FEMALE","preferredGender":"MALE",
       "city":"تهران","bio":"سلام","interests":["کتاب"],"ageMin":20,"ageMax":40,"maxDistance":50}'
```

### آپلود عکس
```bash
curl -b jar.txt -F "file=@photo.jpg;type=image/jpeg" http://localhost:3000/api/profile/photos
```

### پسندیدن و بررسی Match
```bash
curl -b jar.txt -X POST http://localhost:3000/api/actions/like \
  -H 'Content-Type: application/json' -d '{"toUserId":"<USER_ID>"}'
# → {"ok":true,"data":{"matched":true,"matchId":"…","profile":{…}}}
```

### ارسال پیام
```bash
curl -b jar.txt -X POST http://localhost:3000/api/matches/<MATCH_ID>/messages \
  -H 'Content-Type: application/json' -d '{"content":"سلام!"}'
```

### حذف حساب
```bash
curl -b jar.txt -X DELETE http://localhost:3000/api/account \
  -H 'Content-Type: application/json' -d '{"confirm":"حذف حساب"}'
```

---

## Endpointهای تازه

### `POST /api/matches/:id/typing`
اعلام «در حال نوشتن…». کلاینت حداکثر هر ۳ ثانیه یک بار صدا می‌زند و فقط یک زمان‌مُهر ذخیره می‌شود.
محدودیت نرخ: ۱۲۰ بار در دقیقه. پاسخ: `{ ok: true, data: { received: true } }`

### `GET /api/notifications/unread`
شمارش پیام‌های خوانده‌نشده برای نشان نوار پایین. پاسخ: `{ ok: true, data: { messages: number } }`

### `GET /api/health`
بررسی سلامت سرویس و اتصال دیتابیس (برای HEALTHCHECK داکر). پاسخ ۲۰۰ یا ۵۰۳.

### تغییرات در Endpointهای موجود

| Endpoint | تغییر |
|---|---|
| `GET /api/profiles/discover` | پارامترهای اختیاری `ageMin`, `ageMax`, `city`, `interest` + بازگرداندن `options.cities` و `options.interests` برای ساخت فیلترها |
| `GET /api/matches/:id/messages` | افزوده شدن `peerTyping` (بولی) و `peerLastActiveAt` (فقط اگر طرف مقابل نمایش وضعیت را فعال کرده باشد) |
| `PATCH /api/settings` | پذیرش کلید جدید `showOnline` |

---

## تأیید هویت (نشان «پروفایل تأییدشده»)

| Endpoint | توضیح |
|---|---|
| `GET /api/verification` | وضعیت تأیید من + **ژست اختصاصی** (پایدار بر اساس شناسه کاربر) |
| `POST /api/verification` | ارسال سلفیِ ژست‌دار (multipart، فقط JPG/PNG/WebP، سقف ۳MB، اعتبارسنجی magic bytes، ۵ بار در ۲۴ ساعت) |
| `DELETE /api/verification` | انصراف از درخواست + حذف فیزیکی تصویر |
| `GET /api/admin/verifications?status=PENDING|ALL` | صف بررسی (فقط مدیر) |
| `PATCH /api/admin/verifications/:id` | `{ action: 'APPROVE' \| 'REJECT', note?: string }` — وضعیت پروفایل به‌روزرسانی، **سلفی حذف** و ایمیل نتیجه ارسال می‌شود |

- فیلد `isVerified` به همه پاسخ‌های پروفایل عمومی اضافه شد (کاوش، آشنایی‌ها، جزئیات پروفایل، چت).
- آمار مدیریت دو مقدار تازه دارد: `verifiedUsers` و `pendingVerifications`.

## ایمیل تراکنشی

| موقعیت | قالب |
|---|---|
| ثبت‌نام | تأیید ایمیل (اعتبار ۲۴ ساعت) |
| فراموشی رمز | بازیابی رمز عبور (اعتبار ۶۰ دقیقه) |
| آشنایی دوطرفه | اعلان «آشنایی تازه» — فقط اگر `settings.notifyMatches` روشن و ایمیل تأییدشده باشد |
| نتیجه تأیید هویت | تأیید یا رد، همراه با یادداشت بررسی‌کننده |

ارسال از طریق **Resend REST API** با `fetch` (بدون SDK). اگر `RESEND_API_KEY` تعریف نشده باشد، ایمیل ارسال نمی‌شود و فقط `[MAIL:SKIPPED]` در کنسول سرور چاپ می‌گردد — پروژه بدون هیچ سرویس بیرونی هم کار می‌کند.
