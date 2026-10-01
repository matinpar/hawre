# فعال‌سازی CI (GitHub Actions)

فایل `github-actions-ci.yml` همان گردش‌کار CI پروژه است (typecheck، lint، migrate، build و ساخت ایمیج داکر).

توکنِ دسترسیِ استفاده‌شده برای اولین push، مجوز `workflow` نداشت و GitHub اجازه نمی‌دهد یک اپ OAuth
بدون آن مجوز فایل‌های `.github/workflows/` را بسازد. برای فعال کردن CI یکی از این دو کار را بکنید:

**الف) از خود GitHub (ساده‌ترین، حتی با گوشی):**
1. وارد مخزن شوید → **Add file** → **Create new file**
2. نام فایل را دقیقاً بگذارید: `.github/workflows/ci.yml`
3. محتوای `docs/ci/github-actions-ci.yml` را کپی و paste کنید → **Commit**

**ب) از کامپیوتر:**
```bash
mkdir -p .github/workflows
cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml
git add .github && git commit -m "فعال‌سازی CI" && git push
```
