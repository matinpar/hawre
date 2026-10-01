import { handle, ok, parseBody, requireUser, HttpError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { messageSchema } from '@/lib/validation';
import { rateLimit, sanitizeText } from '@/lib/security';
import { blockedUserIds } from '@/lib/matching';

export const dynamic = 'force-dynamic';

async function assertMember(userId: string, matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.userOneId !== userId && match.userTwoId !== userId)) {
    throw new HttpError('این گفت‌وگو یافت نشد.', 404);
  }
  if (match.status !== 'ACTIVE') throw new HttpError('این گفت‌وگو دیگر فعال نیست.', 403);
  const otherId = match.userOneId === userId ? match.userTwoId : match.userOneId;
  return { match, otherId };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    const { match, otherId } = await assertMember(me.id, params.id);
    const messages = await prisma.message.findMany({
      where: { matchId: params.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, senderId: true, content: true, isRead: true, createdAt: true },
    });
    await prisma.message.updateMany({
      where: { matchId: params.id, receiverId: me.id, isRead: false },
      data: { isRead: true },
    });
    // «در حال نوشتن…» تا ۶ ثانیه پس از آخرین ضربه‌کلید طرف مقابل معتبر است
    const peerTypingAt = match.userOneId === me.id ? match.twoTypingAt : match.oneTypingAt;
    const peerTyping = !!peerTypingAt && Date.now() - peerTypingAt.getTime() < 6000;

    // وضعیت آنلاین طرف مقابل، فقط اگر خودش اجازه داده باشد
    const peer = await prisma.user.findUnique({
      where: { id: otherId },
      select: { lastActiveAt: true, settings: { select: { showOnline: true } } },
    });
    const sharesPresence = peer?.settings?.showOnline !== false;

    return ok({
      messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString(), mine: m.senderId === me.id })),
      peerTyping,
      peerLastActiveAt: sharesPresence ? (peer?.lastActiveAt.toISOString() ?? null) : null,
    });
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const me = await requireUser();
    await rateLimit('message', me.id, 60, 60);
    const { otherId } = await assertMember(me.id, params.id);

    const blocked = await blockedUserIds(me.id);
    if (blocked.includes(otherId)) throw new HttpError('امکان ارسال پیام به این کاربر وجود ندارد.', 403);

    const body = await parseBody(req, messageSchema);
    const content = sanitizeText(body.content);
    if (!content) throw new HttpError('متن پیام نامعتبر است.', 422);

    const message = await prisma.message.create({
      data: { matchId: params.id, senderId: me.id, receiverId: otherId, content },
      select: { id: true, senderId: true, content: true, isRead: true, createdAt: true },
    });
    await prisma.match.update({ where: { id: params.id }, data: { lastMessageAt: new Date() } });
    await prisma.notification.create({
      data: { userId: otherId, type: 'MESSAGE', title: 'پیام جدید', body: 'یک پیام تازه دریافت کردید.' },
    });

    return ok({ message: { ...message, createdAt: message.createdAt.toISOString(), mine: true } }, 201);
  });
}
