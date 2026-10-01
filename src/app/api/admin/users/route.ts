import { handle, ok, requireAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim() ?? '';
    const take = Math.min(Number(url.searchParams.get('take') ?? 30), 100);

    const users = await prisma.user.findMany({
      where: q
        ? { OR: [{ email: { contains: q } }, { profile: { is: { displayName: { contains: q } } } }] }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        authProvider: true,
        createdAt: true,
        lastActiveAt: true,
        profile: { select: { displayName: true, city: true, profileCompleted: true } },
        _count: { select: { reportsAgainst: true } },
      },
    });
    return ok({ users });
  });
}
