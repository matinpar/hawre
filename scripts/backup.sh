#!/usr/bin/env bash
# پشتیبان‌گیری از دیتابیس و عکس‌های کاربران
#   bash scripts/backup.sh [پوشه-مقصد]
set -euo pipefail
DEST="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backups}"
STAMP="$(date +%F-%H%M)"
mkdir -p "$DEST"

PROJECT="$(basename "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")"
DATA_VOL="${PROJECT}_hawre-data"
UP_VOL="${PROJECT}_hawre-uploads"

docker run --rm -v "$DATA_VOL":/d -v "$DEST":/b alpine \
  tar czf "/b/db-$STAMP.tar.gz" -C /d . 2>/dev/null || echo "⚠ والیوم دیتابیس پیدا نشد: $DATA_VOL"
docker run --rm -v "$UP_VOL":/d -v "$DEST":/b alpine \
  tar czf "/b/uploads-$STAMP.tar.gz" -C /d . 2>/dev/null || echo "⚠ والیوم عکس‌ها پیدا نشد: $UP_VOL"

# نگه‌داری ۱۴ نسخه آخر
ls -1t "$DEST"/db-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t "$DEST"/uploads-*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --

echo "✅ پشتیبان ساخته شد در $DEST (db-$STAMP.tar.gz و uploads-$STAMP.tar.gz)"
