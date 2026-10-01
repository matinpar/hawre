import { handle, ok, requireAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const status = new URL(req.url).searchParams.get('status') ?? undefined;
    const reports = await prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        reporter: { select: { id: true, profile: { select: { displayName: true } } } },
        reported: {
          select: { id: true, accountStatus: true, profile: { select: { displayName: true, city: true } } },
        },
      },
    });
    return ok({ reports });
  });
}
