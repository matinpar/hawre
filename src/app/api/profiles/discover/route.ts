import { handle, ok, requireUser } from '@/lib/api';
import { findCandidates } from '@/lib/matching';
import { toPublicProfile } from '@/lib/serializers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function num(value: string | null, min: number, max: number) {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

export async function GET(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    if (!me.profile?.profileCompleted) return ok({ profiles: [], profileIncomplete: true });

    const sp = new URL(req.url).searchParams;
    const filters = {
      ageMin: num(sp.get('ageMin'), 18, 99),
      ageMax: num(sp.get('ageMax'), 18, 99),
      city: sp.get('city')?.slice(0, 40) || undefined,
      interest: sp.get('interest')?.slice(0, 40) || undefined,
    };

    const candidates = await findCandidates(me.id, 20, filters);
    const profiles = candidates
      .map((c) => toPublicProfile(c, { showDistance: me.settings?.showDistance !== false }))
      .filter(Boolean);

    // گزینه‌های فیلتر بر اساس داده واقعیِ موجود (بدون افشای اطلاعات شخصی)
    const [cities, interestRows] = await Promise.all([
      prisma.profile.findMany({
        where: { profileCompleted: true },
        select: { city: true },
        distinct: ['city'],
        take: 40,
      }),
      prisma.profile.findMany({ where: { profileCompleted: true }, select: { interests: true }, take: 300 }),
    ]);
    const interests = Array.from(
      new Set(interestRows.flatMap((r) => r.interests.split(',').map((i) => i.trim()).filter(Boolean))),
    ).slice(0, 30);

    return ok({
      profiles,
      options: { cities: cities.map((c) => c.city).filter(Boolean).sort(), interests: interests.sort() },
    });
  });
}
