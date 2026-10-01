import { handle, ok, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { ALLOWED_IMAGE_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES } from '@/lib/constants';
import { saveUpload } from '@/lib/storage';
import { rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('photo-upload', me.id, 20, 60 * 60);

    const form = await req.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File)) throw new HttpError('فایلی ارسال نشده است.', 400);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new HttpError('فقط فایل‌های JPG، PNG و WebP مجاز هستند.', 415);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new HttpError('حجم تصویر نباید بیشتر از ۳ مگابایت باشد.', 413);
    }

    const count = await prisma.profilePhoto.count({ where: { userId: me.id } });
    if (count >= MAX_PHOTOS) throw new HttpError(`حداکثر ${MAX_PHOTOS} عکس می‌توانید داشته باشید.`, 400);

    const url = await saveUpload(file, me.id);
    const photo = await prisma.profilePhoto.create({
      data: { userId: me.id, imageUrl: url, isPrimary: count === 0, sortOrder: count },
    });
    if (me.profile && !me.profile.profileCompleted) {
      await prisma.profile.update({ where: { userId: me.id }, data: { profileCompleted: true } });
    }
    return ok({ photo: { id: photo.id, url: photo.imageUrl, isPrimary: photo.isPrimary } }, 201);
  });
}
