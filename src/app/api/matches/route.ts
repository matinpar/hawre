import { handle, ok, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { blockedUserIds } from '@/lib/matching';
import { toPublicProfile } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const q = new URL(req.url).searchParams.get('q')?.trim().toLowerCase() ?? '';
    const blocked = await blockedUserIds(me.id);

    const matches = await prisma.match.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ userOneId: me.id }, { userTwoId: me.id }],
      },
      include: {
        userOne: { include: { profile: true, photos: true } },
        userTwo: { include: { profile: true, photos: true } },
        messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    const items = matches
      .map((m) => {
        const other = m.userOneId === me.id ? m.userTwo : m.userOne;
        if (blocked.includes(other.id) || other.accountStatus !== 'ACTIVE') return null;
        const profile = toPublicProfile(other, { showDistance: me.settings?.showDistance !== false });
        if (!profile) return null;
        const last = m.messages[0];
        return {
          matchId: m.id,
          createdAt: m.createdAt.toISOString(),
          lastMessageAt: m.lastMessageAt?.toISOString() ?? null,
          lastActiveAt: other.lastActiveAt.toISOString(),
          unread: 0,
          lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt.toISOString() } : null,
          profile,
        };
      })
      .filter(Boolean)
      .filter((m) => !q || (m as { profile: { displayName: string } }).profile.displayName.toLowerCase().includes(q));

    const unreadCounts = await prisma.message.groupBy({
      by: ['matchId'],
      where: { receiverId: me.id, isRead: false, deletedAt: null },
      _count: { _all: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.matchId, u._count._all]));
    for (const item of items as { matchId: string; unread: number }[]) {
      item.unread = unreadMap.get(item.matchId) ?? 0;
    }

    return ok({ matches: items });
  });
}
