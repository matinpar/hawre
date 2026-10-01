import { handle, ok } from '@/lib/api';
import { destroySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  return handle(async () => {
    destroySession();
    return ok({ message: 'از حساب خود خارج شدید.' });
  });
}
