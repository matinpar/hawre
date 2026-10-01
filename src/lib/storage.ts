import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES } from './constants';
import { HttpError } from './api';

/**
 * ذخیره‌سازی محلی روی دیسک (ساده‌ترین و کم‌هزینه‌ترین گزینه برای MVP).
 * برای Production می‌توان با S3 یا هر سرویس سازگار جایگزین کرد (توضیح در README).
 */
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const MAGIC: { ext: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    ext: 'webp',
    test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

export async function saveUpload(file: File, userId: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new HttpError('فقط فایل‌های JPG، PNG و WebP مجاز هستند.', 415);
  }
  if (file.size > MAX_PHOTO_BYTES) throw new HttpError('حجم تصویر نباید بیشتر از ۳ مگابایت باشد.', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  // اعتبارسنجی امضای واقعی فایل؛ صرفاً به content-type اعتماد نمی‌کنیم
  const match = MAGIC.find((m) => m.test(buffer));
  if (!match) throw new HttpError('فایل ارسالی یک تصویر معتبر نیست.', 415);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${userId.slice(0, 8)}-${crypto.randomBytes(12).toString('hex')}.${match.ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer, { mode: 0o644 });
  return `/uploads/${name}`;
}

export async function deleteUpload(url: string) {
  if (!url.startsWith('/uploads/')) return; // آدرس‌های خارجی (مثل عکس Google) حذف فیزیکی ندارند
  const base = path.basename(url);
  if (base.includes('..') || base.includes('/')) return;
  await fs.unlink(path.join(UPLOAD_DIR, base)).catch(() => {});
}
