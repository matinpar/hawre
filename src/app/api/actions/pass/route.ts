import { handle, ok, parseBody, requireCompleteProfile, HttpError } from '@/lib/api';
import { actionSchema } from '@/lib/validation';
import { recordAction } from '@/lib/matching';
import { rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return handle(async () => {
    const me = await requireCompleteProfile();
    await rateLimit('action', me.id, 300, 60 * 60);
    const { toUserId } = await parseBody(req, actionSchema);
    if (toUserId === me.id) throw new HttpError('عملیات نامعتبر است.', 400);
    await recordAction(me.id, toUserId, 'PASS');
    return ok({ matched: false });
  });
}
