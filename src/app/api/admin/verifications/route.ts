import { handle, ok, requireAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** صف درخواست‌های تأیید هویت برای بررسی مدیر */
export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const status = new URL(req.url).searchParams.get('status') ?? 'PENDING';

    const items = await prisma.verification.findMany({
      where: status === 'ALL' ? undefined : { status },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        gesture: true,
        selfieUrl: true,
        note: true,
        createdAt: true,
        reviewedAt: true,
        user: {
          select: {
            id: true,
            accountStatus: true,
            profile: { select: { displayName: true, city: true, isVerified: true } },
            photos: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
          },
        },
      },
    });

    return ok({
      verifications: items.map((v) => ({
        id: v.id,
        status: v.status,
        gesture: v.gesture,
        selfieUrl: v.selfieUrl,
        note: v.note,
        createdAt: v.createdAt.toISOString(),
        reviewedAt: v.reviewedAt?.toISOString() ?? null,
        user: {
          id: v.user.id,
          displayName: v.user.profile?.displayName ?? '—',
          city: v.user.profile?.city ?? '—',
          isVerified: v.user.profile?.isVerified ?? false,
          accountStatus: v.user.accountStatus,
          primaryPhoto: v.user.photos[0]?.imageUrl ?? null,
        },
      })),
    });
  });
}
