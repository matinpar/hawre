/**
 * ساخت یا ارتقای حساب مدیر با استفاده از متغیرهای محیطی ADMIN_EMAIL و ADMIN_PASSWORD.
 * اجرا:  npx tsx scripts/create-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL و ADMIN_PASSWORD را در فایل .env تعریف کنید.');
  if (password.length < 8) throw new Error('رمز مدیر باید حداقل ۸ کاراکتر باشد.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      authProvider: 'EMAIL',
      settings: { create: { discoverable: false } },
    },
    update: { role: 'ADMIN', passwordHash, emailVerified: true },
  });
  console.log(`حساب مدیر آماده است: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
