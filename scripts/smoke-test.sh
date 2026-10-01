#!/usr/bin/env bash
# تست دودی (Smoke Test) سرتاسری هاوڕێ — روی سرور در حال اجرا اجرا می‌شود.
# اجرا:  bash scripts/smoke-test.sh  (پیش‌فرض: http://localhost:3000)
set -uo pipefail

BASE="${BASE:-http://localhost:3000}"
TMP=$(mktemp -d)
PASS=0; FAIL=0

c() { # نام‌کوکی‌جار
  echo "$TMP/$1.jar"
}

check() { # توضیح، مقدار واقعی، مقدار انتظار
  if [[ "$2" == "$3" ]]; then
    printf '  ✅ %s\n' "$1"; PASS=$((PASS+1))
  else
    printf '  ❌ %s (انتظار: %s ، دریافت: %s)\n' "$1" "$3" "$2"; FAIL=$((FAIL+1))
  fi
}

contains() {
  if [[ "$2" == *"$3"* ]]; then printf '  ✅ %s\n' "$1"; PASS=$((PASS+1));
  else printf '  ❌ %s (پاسخ: %s)\n' "$1" "${2:0:220}"; FAIL=$((FAIL+1)); fi
}

req() { # متد، مسیر، کوکی‌جار، [بدنه json]  → "BODY|||STATUS"
  local method=$1 path=$2 jar=$3 body=${4:-}
  if [[ -n "$body" ]]; then
    curl -s -o "$TMP/out" -w '%{http_code}' -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -b "$jar" -c "$jar" -d "$body"
  else
    curl -s -o "$TMP/out" -w '%{http_code}' -X "$method" "$BASE$path" -b "$jar" -c "$jar"
  fi
}

# پاک‌سازی محدودیت نرخ درخواست پیش از تست (فقط محیط توسعه)
reset_limits() {
  node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.rateLimit.deleteMany().then(()=>p.\$disconnect())" 2>/dev/null
}
reset_limits

STAMP=$(date +%s)
A="alice$STAMP@example.com"
B="bob$STAMP@example.com"

echo "▶ ۱) صفحات عمومی"
check "صفحه Landing (200)" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/)" "200"
check "صفحه ورود (200)" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/login)" "200"
check "صفحه قوانین (200)" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/terms)" "200"
check "صفحه حریم خصوصی (200)" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/privacy)" "200"
check "API محافظت‌شده بدون ورود → ۴۰۱" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/profiles/discover)" "401"

echo "▶ ۲) اعتبارسنجی ثبت‌نام"
S=$(req POST /api/auth/register "$(c x)" '{"email":"bad-email","password":"12345678a","confirmPassword":"12345678a","acceptTerms":true}')
check "ایمیل نامعتبر رد می‌شود" "$S" "422"
contains "پیام خطا فارسی است" "$(cat $TMP/out)" "قالب ایمیل"
S=$(req POST /api/auth/register "$(c x)" "{\"email\":\"$A\",\"password\":\"123a\",\"confirmPassword\":\"123a\",\"acceptTerms\":true}")
check "رمز کوتاه رد می‌شود" "$S" "422"
S=$(req POST /api/auth/register "$(c x)" "{\"email\":\"$A\",\"password\":\"Test12345\",\"confirmPassword\":\"Test12345\",\"acceptTerms\":false}")
check "عدم پذیرش قوانین رد می‌شود" "$S" "422"

echo "▶ ۳) ثبت‌نام و تأیید ایمیل"
S=$(req POST /api/auth/register "$(c a)" "{\"email\":\"$A\",\"password\":\"Test12345\",\"confirmPassword\":\"Test12345\",\"acceptTerms\":true}")
check "ثبت‌نام کاربر A (201)" "$S" "201"
TOKEN=$(grep -o 'token=[a-f0-9]*' "$TMP/out" | head -1 | cut -d= -f2)
S=$(req POST /api/auth/verify-email "$(c a)" "{\"token\":\"$TOKEN\"}")
check "تأیید ایمیل با توکن معتبر" "$S" "200"
S=$(req POST /api/auth/verify-email "$(c a)" "{\"token\":\"$TOKEN\"}")
check "توکن یکبارمصرف دوباره کار نمی‌کند" "$S" "400"
S=$(req POST /api/auth/register "$(c x)" "{\"email\":\"$A\",\"password\":\"Test12345\",\"confirmPassword\":\"Test12345\",\"acceptTerms\":true}")
check "ایمیل تکراری رد می‌شود (409)" "$S" "409"

echo "▶ ۴) پروفایل و آپلود عکس"
S=$(req PUT /api/profile/me "$(c a)" '{"displayName":"آلیس تست","birthDate":"1995-05-05","gender":"FEMALE","preferredGender":"MALE","city":"تهران","bio":"کاربر آزمایشی","interests":["کتاب","سفر"],"ageMin":18,"ageMax":60,"maxDistance":50}')
check "ذخیره پروفایل کاربر A" "$S" "200"
S=$(req PUT /api/profile/me "$(c a)" '{"displayName":"نوجوان","birthDate":"2015-01-01","gender":"FEMALE","preferredGender":"MALE","city":"تهران","bio":"","interests":[],"ageMin":18,"ageMax":60,"maxDistance":50}')
check "محدودیت سنی زیر ۱۸ سال اعمال می‌شود" "$S" "422"

# ساخت یک PNG کوچک معتبر و یک فایل خطرناک
python3 - "$TMP" <<'PY'
import base64, sys, pathlib
d = pathlib.Path(sys.argv[1])
png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
(d/'ok.png').write_bytes(png)
(d/'evil.svg').write_text('<svg onload="alert(1)"></svg>')
(d/'fake.png').write_text('<?php echo 1; ?>')
PY
CODE=$(curl -s -o "$TMP/out" -w '%{http_code}' -b "$(c a)" -c "$(c a)" -F "file=@$TMP/ok.png;type=image/png" $BASE/api/profile/photos)
check "آپلود PNG معتبر (201)" "$CODE" "201"
PHOTO_ID=$(python3 -c "import json,sys;print(json.load(open('$TMP/out'))['data']['photo']['id'])" 2>/dev/null)
CODE=$(curl -s -o "$TMP/out" -w '%{http_code}' -b "$(c a)" -F "file=@$TMP/evil.svg;type=image/svg+xml" $BASE/api/profile/photos)
check "رد فایل SVG خطرناک (415)" "$CODE" "415"
CODE=$(curl -s -o "$TMP/out" -w '%{http_code}' -b "$(c a)" -F "file=@$TMP/fake.png;type=image/png" $BASE/api/profile/photos)
check "رد فایل جعلی با پسوند تصویر (415)" "$CODE" "415"

echo "▶ ۵) ورود، خروج و بازیابی رمز"
S=$(req POST /api/auth/login "$(c t)" "{\"email\":\"$A\",\"password\":\"wrongpass1\"}")
check "رمز اشتباه رد می‌شود (401)" "$S" "401"
S=$(req POST /api/auth/login "$(c t)" "{\"email\":\"$A\",\"password\":\"Test12345\",\"remember\":true}")
check "ورود موفق" "$S" "200"
S=$(req GET /api/auth/me "$(c t)" )
contains "اطلاعات کاربر بدون passwordHash" "$(cat $TMP/out)" '"email"'
if grep -q passwordHash "$TMP/out"; then check "passwordHash به فرانت ارسال نمی‌شود" "نشت" "ok"; else check "passwordHash به فرانت ارسال نمی‌شود" "ok" "ok"; fi
S=$(req POST /api/auth/logout "$(c t)")
check "خروج از حساب" "$S" "200"
S=$(req POST /api/auth/forgot-password "$(c t)" "{\"email\":\"$A\"}")
check "درخواست بازیابی رمز" "$S" "200"
RTOKEN=$(grep -o 'token=[a-f0-9]*' "$TMP/out" | head -1 | cut -d= -f2)
S=$(req POST /api/auth/reset-password "$(c t)" "{\"token\":\"$RTOKEN\",\"password\":\"NewPass12345\",\"confirmPassword\":\"NewPass12345\"}")
check "تعیین رمز جدید" "$S" "200"
S=$(req POST /api/auth/login "$(c t)" "{\"email\":\"$A\",\"password\":\"NewPass12345\"}")
check "ورود با رمز جدید" "$S" "200"

reset_limits
echo "▶ ۶) کاربر دوم، Like و Match دوطرفه"
S=$(req POST /api/auth/register "$(c b)" "{\"email\":\"$B\",\"password\":\"Test12345\",\"confirmPassword\":\"Test12345\",\"acceptTerms\":true}")
check "ثبت‌نام کاربر B" "$S" "201"
req PUT /api/profile/me "$(c b)" '{"displayName":"باب تست","birthDate":"1993-03-03","gender":"MALE","preferredGender":"FEMALE","city":"تهران","bio":"کاربر آزمایشی دوم","interests":["سفر"],"ageMin":18,"ageMax":60,"maxDistance":50}' >/dev/null
curl -s -o /dev/null -b "$(c b)" -F "file=@$TMP/ok.png;type=image/png" $BASE/api/profile/photos
AID=$(python3 -c "
import json,urllib.request
" 2>/dev/null)
req GET /api/profiles/discover "$(c b)" >/dev/null
BOB_SEES=$(python3 -c "import json;d=json.load(open('$TMP/out'))['data']['profiles'];print(next((p['userId'] for p in d if p['displayName']=='آلیس تست'),''))")
contains "کاربر A در Discovery کاربر B دیده می‌شود" "${BOB_SEES:+yes}" "yes"
S=$(req POST /api/actions/like "$(c b)" "{\"toUserId\":\"$BOB_SEES\"}")
check "Like یک‌طرفه ثبت شد" "$S" "200"
contains "هنوز Match نشده" "$(cat $TMP/out)" '"matched":false'
req GET /api/profiles/discover "$(c a)" >/dev/null
ALICE_SEES=$(python3 -c "import json;d=json.load(open('$TMP/out'))['data']['profiles'];print(next((p['userId'] for p in d if p['displayName']=='باب تست'),''))")
S=$(req POST /api/actions/like "$(c a)" "{\"toUserId\":\"$ALICE_SEES\"}")
contains "Match دوطرفه ایجاد شد" "$(cat $TMP/out)" '"matched":true'
MATCH_ID=$(python3 -c "import json;print(json.load(open('$TMP/out'))['data']['matchId'])")
S=$(req POST /api/actions/like "$(c a)" "{\"toUserId\":\"$ALICE_SEES\"}")
check "انتخاب تکراری خطا نمی‌دهد و رکورد دوباره نمی‌سازد" "$S" "200"
req GET /api/profiles/discover "$(c a)" >/dev/null
AGAIN=$(python3 -c "import json;d=json.load(open('$TMP/out'))['data']['profiles'];print(next((p['userId'] for p in d if p['displayName']=='باب تست'),'none'))")
check "پروفایل انتخاب‌شده دوباره نمایش داده نمی‌شود" "$AGAIN" "none"

echo "▶ ۷) چت"
S=$(req GET /api/matches "$(c a)")
contains "Match در فهرست آشنایی‌ها" "$(cat $TMP/out)" "باب تست"
S=$(req POST "/api/matches/$MATCH_ID/messages" "$(c a)" '{"content":"سلام <script>alert(1)</script>"}')
check "ارسال پیام (201)" "$S" "201"
if grep -q '<script>' "$TMP/out"; then check "پاک‌سازی XSS در پیام" "نشت" "ok"; else check "پاک‌سازی XSS در پیام" "ok" "ok"; fi
S=$(req GET "/api/matches/$MATCH_ID/messages" "$(c b)")
contains "دریافت پیام توسط طرف مقابل" "$(cat $TMP/out)" "سلام"
S=$(req POST "/api/matches/$MATCH_ID/messages" "$(c a)" '{"content":""}')
check "پیام خالی رد می‌شود" "$S" "422"
S=$(req GET "/api/matches/$MATCH_ID/messages" "$(c x)")
check "کاربر غیرعضو به گفت‌وگو دسترسی ندارد" "$S" "401"

echo "▶ ۸) گزارش و مسدودسازی"
S=$(req POST /api/reports "$(c a)" "{\"reportedUserId\":\"$ALICE_SEES\",\"reason\":\"HARASSMENT\",\"description\":\"تست گزارش\"}")
check "ثبت گزارش (201)" "$S" "201"
S=$(req POST /api/reports "$(c a)" "{\"reportedUserId\":\"$ALICE_SEES\",\"reason\":\"INVALID\"}")
check "دلیل گزارش نامعتبر رد می‌شود" "$S" "422"
S=$(req POST "/api/users/$ALICE_SEES/block" "$(c a)")
check "مسدود کردن کاربر" "$S" "200"
req GET /api/matches "$(c a)" >/dev/null
COUNT=$(python3 -c "import json;print(len(json.load(open('$TMP/out'))['data']['matches']))")
check "کاربر مسدودشده از فهرست آشنایی‌ها حذف شد" "$COUNT" "0"
S=$(req GET "/api/profiles/$ALICE_SEES" "$(c a)")
check "پروفایل کاربر مسدودشده در دسترس نیست (403)" "$S" "403"

echo "▶ ۹) کنترل دسترسی مدیر"
S=$(req GET /api/admin/stats "$(c a)")
check "کاربر عادی به آمار مدیریت دسترسی ندارد (403)" "$S" "403"
S=$(req GET /api/admin/users "$(c a)")
check "کاربر عادی به فهرست کاربران دسترسی ندارد (403)" "$S" "403"
S=$(req GET /api/admin/stats "$(c x)")
check "کاربر مهمان به پنل مدیریت دسترسی ندارد (401)" "$S" "401"
ADMIN_HTML=$(curl -s -b "$(c a)" $BASE/admin)
if [[ "$ADMIN_HTML" == *"کل کاربران"* ]]; then
  check "صفحه /admin هیچ داده مدیریتی به کاربر عادی نشان نمی‌دهد" "نشت" "ok"
else
  check "صفحه /admin هیچ داده مدیریتی به کاربر عادی نشان نمی‌دهد" "ok" "ok"
fi
S=$(req POST /api/auth/login "$(c adm)" "{\"email\":\"${ADMIN_EMAIL:-admin@hawre.test}\",\"password\":\"${ADMIN_PASSWORD:-Admin12345!}\"}")
check "ورود مدیر" "$S" "200"
S=$(req GET /api/admin/stats "$(c adm)")
check "دسترسی مدیر به آمار (200)" "$S" "200"
contains "آمار شامل تعداد کاربران است" "$(cat $TMP/out)" '"users"'
S=$(req GET /api/admin/reports "$(c adm)")
check "دسترسی مدیر به گزارش‌ها (200)" "$S" "200"

echo "▶ ۹.۵) نشست جایگزین با توکن (برای مرورگرهایی که کوکی iframe را مسدود می‌کنند)"
TOKEN=$(curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$A\",\"password\":\"NewPass12345\"}" | python3 -c "import json,sys;print(json.load(sys.stdin)['data'].get('sessionToken',''))")
contains "توکن نشست در پاسخ ورود برگردانده می‌شود" "${TOKEN:+yes}" "yes"
S=$(curl -s -o "$TMP/out" -w '%{http_code}' -H "Authorization: Bearer $TOKEN" $BASE/api/profiles/discover)
check "دسترسی به API فقط با هدر Bearer (بدون کوکی)" "$S" "200"
curl -s -o "$TMP/out" -H "Authorization: Bearer $TOKEN" $BASE/api/auth/me
contains "شناسایی کاربر با توکن" "$(cat $TMP/out)" '"user"'
curl -s -o "$TMP/out" -H "Authorization: Bearer invalid.token.value" $BASE/api/auth/me
contains "توکن جعلی پذیرفته نمی‌شود" "$(cat $TMP/out)" '"user":null'
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" $BASE/api/admin/stats)
check "توکن کاربر عادی به پنل مدیریت دسترسی ندارد (403)" "$S" "403"

echo "▶ ۹.۵) تأیید هویت (نشان پروفایل تأییدشده)"
S=$(req GET /api/verification "$(c x)")
check "وضعیت تأیید هویت بدون ورود ممکن نیست (401)" "$S" "401"
S=$(req GET /api/verification "$(c a)")
check "کاربر واردشده وضعیت تأیید هویت خود را می‌بیند" "$S" "200"
contains "ژست اختصاصی برای کاربر تعیین می‌شود" "$(cat $TMP/out)" '"gesture"'
S=$(req GET /api/admin/verifications "$(c a)")
check "کاربر عادی به صف تأیید هویت دسترسی ندارد (403)" "$S" "403"
S=$(req GET /api/admin/verifications "$(c adm)")
check "مدیر صف تأیید هویت را می‌بیند" "$S" "200"
S=$(req PATCH /api/admin/verifications/non-existent-id "$(c adm)" '{"action":"APPROVE"}')
check "بررسی درخواست ناموجود رد می‌شود (404)" "$S" "404"
S=$(req PATCH /api/admin/verifications/non-existent-id "$(c adm)" '{"action":"WRONG"}')
check "اقدام نامعتبر در بررسی رد می‌شود (422)" "$S" "422"

echo "▶ ۱۰) دسترسی به داده دیگران و حذف حساب"
S=$(req PATCH /api/profile/me "$(c x)" '{"displayName":"هکر"}')
check "ویرایش پروفایل بدون ورود ممکن نیست (401)" "$S" "401"
S=$(req DELETE /api/account "$(c b)" '{"confirm":"اشتباه"}')
check "حذف حساب بدون تأیید صحیح رد می‌شود" "$S" "422"
S=$(req DELETE /api/account "$(c b)" '{"confirm":"حذف حساب"}')
check "حذف حساب کاربر B" "$S" "200"
S=$(req GET /api/auth/me "$(c b)")
contains "نشست کاربر حذف‌شده باطل شد" "$(cat $TMP/out)" '"user":null'

echo
echo "──────────────────────────────"
echo "موفق: $PASS    ناموفق: $FAIL"
rm -rf "$TMP"
[[ $FAIL -eq 0 ]]
