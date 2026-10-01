import { handle, ok, parseBody, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { settingsSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    const settings = me.settings ?? (await prisma.settings.create({ data: { userId: me.id } }));
    return ok({ settings, email: me.email, emailVerified: me.emailVerified, authProvider: me.authProvider });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await parseBody(req, settingsSchema);

    if (body.email && body.email !== me.email) {
      const exists = await prisma.user.findUnique({ where: { email: body.email } });
      if (exists) throw new HttpError('این ایمیل قبلاً استفاده شده است.', 409);
      await prisma.user.update({ where: { id: me.id }, data: { email: body.email, emailVerified: false } });
    }

    const { email: _ignored, ...flags } = body;
    const settings = await prisma.settings.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...flags },
      update: flags,
    });
    return ok({ settings, message: 'تنظیمات ذخیره شد.' });
  });
}
