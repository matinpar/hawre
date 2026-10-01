import 'server-only';
import { prisma } from './prisma';
import { ageFromBirthDate } from './validation';
import { sendNewMatchEmail } from './mailer';

/** ترتیب پایدار برای جلوگیری از رکورد تکراری Match */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function blockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
  return [...ids];
}

export type DiscoverFilters = {
  /** حداقل سن دلخواه برای همین جست‌وجو (روی ترجیح ذخیره‌شده پروفایل اثر نمی‌گذارد) */
  ageMin?: number;
  ageMax?: number;
  city?: string;
  interest?: string;
};

/** کاندیداهای Discovery بر اساس جنسیت، محدوده سنی، وضعیت حساب، فیلترهای موقت و تعامل‌های قبلی */
export async function findCandidates(userId: string, limit = 20, filters: DiscoverFilters = {}) {
  const me = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, settings: true },
  });
  if (!me?.profile) return [];

  const [seen, blocked] = await Promise.all([
    prisma.userAction.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    blockedUserIds(userId),
  ]);

  const excluded = new Set<string>([userId, ...seen.map((s) => s.toUserId), ...blocked]);

  const genderFilter =
    me.profile.preferredGender === 'ANY' ? undefined : { gender: me.profile.preferredGender };

  const candidates = await prisma.user.findMany({
    where: {
      id: { notIn: [...excluded] },
      accountStatus: 'ACTIVE',
      settings: { is: { discoverable: true } },
      profile: {
        is: {
          profileCompleted: true,
          ...(genderFilter ?? {}),
          // فیلتر متقابل: من باید در ترجیح آن‌ها بگنجم
          OR: [{ preferredGender: 'ANY' }, { preferredGender: me.profile.gender }],
        },
      },
    },
    include: { profile: true, photos: true },
    orderBy: { lastActiveAt: 'desc' },
    take: limit * 4,
  });

  // فیلترهای موقتِ همین جست‌وجو، محدودتر از ترجیح ذخیره‌شده اعمال می‌شوند
  const wantMinAge = Math.max(18, filters.ageMin ?? me.profile.ageMin);
  const wantMaxAge = Math.min(99, filters.ageMax ?? me.profile.ageMax);
  const wantCity = filters.city?.trim().toLowerCase();
  const wantInterest = filters.interest?.trim().toLowerCase();

  const filtered = candidates.filter((c) => {
    if (!c.profile) return false;
    const age = ageFromBirthDate(c.profile.birthDate);
    const myAge = ageFromBirthDate(me.profile!.birthDate);
    const inMyRange = age >= wantMinAge && age <= wantMaxAge;
    const iAmInTheirRange = myAge >= c.profile.ageMin && myAge <= c.profile.ageMax;
    if (!inMyRange || !iAmInTheirRange) return false;
    if (wantCity && c.profile.city.trim().toLowerCase() !== wantCity) return false;
    if (wantInterest) {
      const list = c.profile.interests.split(',').map((i) => i.trim().toLowerCase());
      if (!list.includes(wantInterest)) return false;
    }
    return true;
  });

  // اولویت ساده: هم‌شهری‌ها و علایق مشترک بالاتر می‌آیند
  const myInterests = new Set(me.profile.interests.split(',').filter(Boolean));
  filtered.sort((a, b) => score(b) - score(a));
  function score(u: (typeof filtered)[number]) {
    let s = 0;
    if (u.profile!.city === me!.profile!.city) s += 3;
    const shared = u.profile!.interests.split(',').filter((i) => i && myInterests.has(i)).length;
    s += shared;
    return s;
  }

  return filtered.slice(0, limit);
}

/** ثبت انتخاب کاربر و ایجاد Match در صورت علاقه دوطرفه */
export async function recordAction(fromUserId: string, toUserId: string, actionType: 'LIKE' | 'PASS') {
  await prisma.userAction.upsert({
    where: { fromUserId_toUserId: { fromUserId, toUserId } },
    create: { fromUserId, toUserId, actionType },
    update: { actionType },
  });

  if (actionType !== 'LIKE') return { matched: false as const };

  const reciprocal = await prisma.userAction.findUnique({
    where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
  });
  if (!reciprocal || reciprocal.actionType !== 'LIKE') return { matched: false as const };

  const [userOneId, userTwoId] = orderPair(fromUserId, toUserId);
  const match = await prisma.match.upsert({
    where: { userOneId_userTwoId: { userOneId, userTwoId } },
    create: { userOneId, userTwoId, status: 'ACTIVE' },
    update: { status: 'ACTIVE' },
  });

  await prisma.notification.createMany({
    data: [fromUserId, toUserId].map((uid) => ({
      userId: uid,
      type: 'MATCH',
      title: 'آشنایی دوطرفه!',
      body: 'یک آشنایی دوطرفه شکل گرفت. گفت‌وگو را شروع کنید.',
    })),
  });

  // اعلان ایمیلی «آشنایی تازه» — فقط برای کسانی که این اعلان را خاموش نکرده‌اند
  void notifyMatchByEmail(fromUserId, toUserId);

  return { matched: true as const, matchId: match.id };
}


/** ارسال ایمیل «آشنایی دوطرفه» به هر دو طرف، با احترام به تنظیم اعلان هرکس */
async function notifyMatchByEmail(a: string, b: string) {
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: [a, b] } },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profile: { select: { displayName: true } },
        settings: { select: { notifyMatches: true } },
      },
    });
    const [first, second] = users;
    if (!first || !second) return;
    const pairs: [typeof first, typeof second][] = [
      [first, second],
      [second, first],
    ];
    for (const [target, peer] of pairs) {
      if (!target.emailVerified) continue;
      if (target.settings?.notifyMatches === false) continue;
      await sendNewMatchEmail(target.email, peer.profile?.displayName ?? 'یک کاربر');
    }
  } catch (err) {
    // شکست ارسال ایمیل هرگز نباید جریان Match را خراب کند
    console.error('[MAIL:MATCH]', err);
  }
}
