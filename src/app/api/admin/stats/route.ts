import { handle, ok, requireAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      activeUsers,
      newToday,
      newWeek,
      matches,
      messages,
      reports,
      pendingReports,
      blocks,
      verifiedUsers,
      pendingVerifications,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
        prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.match.count({ where: { status: 'ACTIVE' } }),
        prisma.message.count({ where: { deletedAt: null } }),
        prisma.report.count(),
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.block.count(),
        prisma.profile.count({ where: { isVerified: true } }),
        prisma.verification.count({ where: { status: 'PENDING' } }),
      ]);

    return ok({
      stats: {
        users,
        activeUsers,
        newToday,
        newWeek,
        matches,
        messages,
        reports,
        pendingReports,
        blocks,
        verifiedUsers,
        pendingVerifications,
      },
    });
  });
}
