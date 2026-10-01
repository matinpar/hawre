/**
 * داده‌های آزمایشی هاوڕێ
 * همه نام‌ها، شهرها و متن‌ها ساختگی هستند و تصاویر به صورت آواتارهای SVG تولید می‌شوند
 * (هیچ عکس واقعی از افراد واقعی استفاده نشده است).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const AVATAR_DIR = path.join(process.cwd(), 'public', 'seed');

const PALETTES = [
  ['#f5455f', '#ffaf4b', '#ffcabd'],
  ['#e23f38', '#ffc46f', '#ff9a7d'],
  ['#5c3355', '#ff7a45', '#ffb08f'],
  ['#c92249', '#ffa93c', '#ffd2a1'],
  ['#ff7d63', '#ffdda8', '#f95c4b'],
  ['#3d2039', '#f95c4b', '#ffa93c'],
];

/**
 * تصویر جایگزین انتزاعی (بدون استفاده از عکس افراد واقعی):
 * چند لکه رنگی محو روی گرادیان + حرف اول نام. کاملاً ساختگی و بدون حق نشر.
 */
function makeAvatar(name: string, index: number) {
  const [c1, c2, c3] = PALETTES[index % PALETTES.length];
  const letter = name.slice(0, 1);
  const seed = index * 37;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="b1" cx="50%" cy="50%">
      <stop offset="0%" stop-color="${c3}" stop-opacity=".95"/>
      <stop offset="100%" stop-color="${c3}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b2" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <circle cx="${140 + (seed % 120)}" cy="${200 + (seed % 90)}" r="230" fill="url(#b1)"/>
  <circle cx="${430 - (seed % 100)}" cy="${610 - (seed % 80)}" r="260" fill="url(#b2)"/>
  <g filter="url(#soft)" opacity=".35">
    <circle cx="${300 + (seed % 140) - 70}" cy="430" r="150" fill="${c3}"/>
  </g>
  <g opacity=".22" stroke="#ffffff" stroke-width="2" fill="none">
    <circle cx="300" cy="400" r="150"/><circle cx="300" cy="400" r="205"/><circle cx="300" cy="400" r="260"/>
  </g>
  <text x="300" y="450" font-size="210" font-family="Tahoma, Verdana, sans-serif" font-weight="bold"
        text-anchor="middle" fill="rgba(255,255,255,.92)">${letter}</text>
  <rect x="0" y="640" width="600" height="160" fill="rgba(23,19,43,.18)"/>
</svg>`;
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  const file = `seed-${index + 1}.svg`;
  fs.writeFileSync(path.join(AVATAR_DIR, file), svg, 'utf8');
  return `/seed/${file}`;
}

/**
 * تصاویر تصویرسازی‌شده (illustration) برای پروفایل‌های آزمایشی.
 * هیچ‌کدام عکس واقعی از افراد نیستند؛ همگی طرح گرافیکی ساختگی‌اند.
 */
const ILLUSTRATIONS = {
  FEMALE: ['girl-1.jpg', 'girl-2.jpg', 'girl-3.jpg', 'girl-4.jpg', 'girl-5.jpg', 'girl-6.jpg'],
  MALE: ['boy-1.jpg', 'boy-2.jpg', 'boy-3.jpg', 'boy-4.jpg'],
  OTHER: ['girl-3.jpg', 'boy-2.jpg'],
} as const;

const used: Record<string, number> = { FEMALE: 0, MALE: 0, OTHER: 0 };

/** انتخاب تصویر مناسب جنسیت، بدون تکرار پشت‌سرهم */
function pickIllustration(gender: 'MALE' | 'FEMALE' | 'OTHER') {
  const list = ILLUSTRATIONS[gender];
  const file = list[used[gender]++ % list.length];
  return `/seed/${file}`;
}

type SeedPerson = {
  name: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  preferredGender: 'MALE' | 'FEMALE' | 'ANY';
  birthDate: string;
  city: string;
  bio: string;
  interests: string[];
};

const PEOPLE: SeedPerson[] = [
  { name: 'آرمیتا', email: 'armita@hawre.test', gender: 'FEMALE', preferredGender: 'MALE', birthDate: '1997-04-12', city: 'تهران', bio: 'معمار، عاشق پیاده‌روی شبانه و قهوه بدون شکر.', interests: ['هنر', 'قهوه', 'سفر'] },
  { name: 'نیما', email: 'nima@hawre.test', gender: 'MALE', preferredGender: 'FEMALE', birthDate: '1994-09-03', city: 'تهران', bio: 'برنامه‌نویس و کوهنورد آخر هفته‌ها.', interests: ['برنامه‌نویسی', 'کوهنوردی', 'موسیقی'] },
  { name: 'سوگند', email: 'sogand@hawre.test', gender: 'FEMALE', preferredGender: 'ANY', birthDate: '1999-01-25', city: 'اصفهان', bio: 'دانشجوی سینما؛ اگر فیلم کوتاه دوست داری با هم حرف بزنیم.', interests: ['سینما', 'کتاب', 'عکاسی'] },
  { name: 'کیان', email: 'kian@hawre.test', gender: 'MALE', preferredGender: 'FEMALE', birthDate: '1992-07-19', city: 'شیراز', bio: 'آشپزی می‌کنم و شنبه‌ها می‌دوم.', interests: ['آشپزی', 'دویدن', 'طبیعت‌گردی'] },
  { name: 'ترانه', email: 'taraneh@hawre.test', gender: 'FEMALE', preferredGender: 'MALE', birthDate: '1996-11-08', city: 'مشهد', bio: 'مترجم کتاب، دوستدار گربه‌ها و باران.', interests: ['کتاب', 'حیوانات', 'موسیقی'] },
  { name: 'بردیا', email: 'bardia@hawre.test', gender: 'MALE', preferredGender: 'ANY', birthDate: '1990-02-14', city: 'تبریز', bio: 'شطرنج‌باز آماتور و علاقه‌مند به تاریخ.', interests: ['شطرنج', 'کتاب', 'سفر'] },
  { name: 'هستی', email: 'hasti@hawre.test', gender: 'FEMALE', preferredGender: 'MALE', birthDate: '1998-06-30', city: 'کرج', bio: 'مربی یوگا؛ صبح‌ها زودتر از خورشید بیدارم.', interests: ['یوگا', 'ورزش', 'طبیعت‌گردی'] },
  { name: 'رهام', email: 'raham@hawre.test', gender: 'MALE', preferredGender: 'FEMALE', birthDate: '1993-12-05', city: 'تهران', bio: 'عکاس خیابانی، دنبال نورهای عجیب شهر.', interests: ['عکاسی', 'سفر', 'قهوه'] },
  { name: 'پرنیا', email: 'parnia@hawre.test', gender: 'FEMALE', preferredGender: 'ANY', birthDate: '1995-03-21', city: 'رشت', bio: 'گرافیست و علاقه‌مند به موسیقی محلی.', interests: ['هنر', 'موسیقی', 'آشپزی'] },
  { name: 'سامان', email: 'saman@hawre.test', gender: 'MALE', preferredGender: 'FEMALE', birthDate: '1991-08-17', city: 'یزد', bio: 'راهنمای گردشگری؛ کویر را بیشتر از دریا دوست دارم.', interests: ['سفر', 'عکاسی', 'طبیعت‌گردی'] },
  { name: 'دنیا', email: 'donya@hawre.test', gender: 'FEMALE', preferredGender: 'MALE', birthDate: '2000-05-02', city: 'اهواز', bio: 'دانشجوی مهندسی، بازی‌های رومیزی را جدی می‌گیرم.', interests: ['بازی', 'شطرنج', 'سینما'] },
  { name: 'آریا', email: 'aria@hawre.test', gender: 'OTHER', preferredGender: 'ANY', birthDate: '1996-10-11', city: 'تهران', bio: 'نوازنده نیمه‌حرفه‌ای و عاشق کتاب‌فروشی‌های قدیمی.', interests: ['موسیقی', 'کتاب', 'تئاتر'] },
];

// محافظ: داده آزمایشی هرگز نباید روی سرور واقعی اجرا شود
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED_IN_PRODUCTION !== 'true') {
  console.error('⛔ اجرای seed در Production مسدود است. در صورت نیاز ALLOW_SEED_IN_PRODUCTION=true بگذارید.');
  process.exit(1);
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@hawre.test').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const userPassword = process.env.SEED_USER_PASSWORD;

  if (!adminPassword || !userPassword) {
    throw new Error(
      'برای اجرای Seed باید ADMIN_PASSWORD و SEED_USER_PASSWORD در فایل .env تعریف شده باشند (رمزها داخل کد قرار نمی‌گیرند).',
    );
  }

  console.log('پاک‌سازی داده‌های قبلی…');
  await prisma.$transaction([
    prisma.verification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.match.deleteMany(),
    prisma.userAction.deleteMany(),
    prisma.block.deleteMany(),
    prisma.report.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.profilePhoto.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.token.deleteMany(),
    prisma.settings.deleteMany(),
    prisma.rateLimit.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // حساب مدیر (رمز فقط از متغیر محیطی خوانده می‌شود)
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      emailVerified: true,
      authProvider: 'EMAIL',
      settings: { create: { discoverable: false } },
      profile: {
        create: {
          displayName: 'مدیر هاوڕێ',
          birthDate: new Date('1990-01-01'),
          gender: 'OTHER',
          preferredGender: 'ANY',
          city: 'تهران',
          bio: 'حساب مدیریتی آزمایشی.',
          interests: '',
          profileCompleted: true,
        },
      },
    },
  });
  console.log(`حساب مدیر ساخته شد: ${admin.email}`);

  const hash = await bcrypt.hash(userPassword, 12);
  const created: { id: string; name: string }[] = [];

  for (const [index, person] of PEOPLE.entries()) {
    const avatar = makeAvatar(person.name, index);
    const portrait = pickIllustration(person.gender);
    const user = await prisma.user.create({
      data: {
        email: person.email,
        passwordHash: hash,
        emailVerified: true,
        authProvider: 'EMAIL',
        lastActiveAt: new Date(Date.now() - index * 3600_000),
        settings: { create: {} },
        profile: {
          create: {
            displayName: person.name,
            birthDate: new Date(person.birthDate),
            gender: person.gender,
            preferredGender: person.preferredGender,
            city: person.city,
            bio: person.bio,
            interests: person.interests.join(','),
            ageMin: 18,
            ageMax: 60,
            maxDistance: 60,
            profileCompleted: true,
          },
        },
        photos: {
          create: [
            { imageUrl: portrait, isPrimary: true, sortOrder: 0 },
            { imageUrl: avatar, isPrimary: false, sortOrder: 1 },
          ],
        },
      },
    });
    created.push({ id: user.id, name: person.name });
  }
  console.log(`${created.length} پروفایل آزمایشی ساخته شد.`);

  const byName = (n: string) => created.find((c) => c.name === n)!;

  // چند انتخاب نمونه
  const likes: [string, string][] = [
    ['آرمیتا', 'نیما'],
    ['نیما', 'آرمیتا'], // Match اول
    ['ترانه', 'رهام'],
    ['رهام', 'ترانه'], // Match دوم
    ['سوگند', 'بردیا'],
    ['کیان', 'هستی'],
    ['دنیا', 'آریا'],
  ];
  for (const [from, to] of likes) {
    await prisma.userAction.create({
      data: { fromUserId: byName(from).id, toUserId: byName(to).id, actionType: 'LIKE' },
    });
  }
  await prisma.userAction.create({
    data: { fromUserId: byName('پرنیا').id, toUserId: byName('سامان').id, actionType: 'PASS' },
  });

  async function makeMatch(a: string, b: string) {
    const [one, two] = [byName(a).id, byName(b).id].sort();
    return prisma.match.create({ data: { userOneId: one, userTwoId: two, lastMessageAt: new Date() } });
  }

  const match1 = await makeMatch('آرمیتا', 'نیما');
  const match2 = await makeMatch('ترانه', 'رهام');

  const conversation = [
    { match: match1, from: 'آرمیتا', to: 'نیما', text: 'سلام! پروفایلت جالب بود، کوهنوردی حرفه‌ای می‌روی؟' },
    { match: match1, from: 'نیما', to: 'آرمیتا', text: 'سلام! نه حرفه‌ای نیستم، بیشتر آخر هفته‌ها مسیرهای ساده.' },
    { match: match1, from: 'آرمیتا', to: 'نیما', text: 'عالیه، منم دنبال یک همراه برای مسیرهای سبک بودم.' },
    { match: match1, from: 'نیما', to: 'آرمیتا', text: 'پس آخر هفته یک مسیر سبک پیشنهاد می‌دهم؛ نظرت چیست؟' },
    { match: match2, from: 'رهام', to: 'ترانه', text: 'سلام ترانه، کدام کتاب را الان ترجمه می‌کنی؟' },
    { match: match2, from: 'ترانه', to: 'رهام', text: 'سلام! یک مجموعه داستان کوتاه. عکس‌های خیابانی‌ات را دوست داشتم.' },
  ];

  for (const [i, m] of conversation.entries()) {
    await prisma.message.create({
      data: {
        matchId: m.match.id,
        senderId: byName(m.from).id,
        receiverId: byName(m.to).id,
        content: m.text,
        isRead: i < 3,   // دو پیام آخر خوانده‌نشده می‌مانند تا نشان (badge) در رابط دیده شود
        createdAt: new Date(Date.now() - (conversation.length - i) * 600_000),
      },
    });
  }

  // چند پروفایل تأییدشده + یک درخواست در صف بررسی (برای نمایش پنل مدیریت)
  await prisma.profile.updateMany({
    where: { userId: { in: [byName('آرمیتا').id, byName('ترانه').id, byName('سامان').id] } },
    data: { isVerified: true },
  });
  await prisma.verification.create({
    data: {
      userId: byName('نیما').id,
      status: 'PENDING',
      gesture: 'دست راست را کنار گوش راست بگیرید',
      selfieUrl: null,
    },
  });

  await prisma.report.create({
    data: {
      reporterId: byName('سوگند').id,
      reportedUserId: byName('سامان').id,
      reason: 'INAPPROPRIATE',
      description: 'گزارش نمونه برای آزمایش پنل مدیریت.',
    },
  });

  console.log('۲ آشنایی دوطرفه، ۵ پیام و ۱ گزارش نمونه ساخته شد.');
  console.log('کاربران آزمایشی با رمز موجود در SEED_USER_PASSWORD قابل ورود هستند.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
