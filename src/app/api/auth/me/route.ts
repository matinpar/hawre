import { handle, ok } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { parseInterests } from '@/lib/serializers';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    return ok({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        authProvider: user.authProvider,
        hasPassword: undefined,
        profileCompleted: Boolean(user.profile?.profileCompleted),
        displayName: user.profile?.displayName ?? null,
        photo: user.photos[0]?.imageUrl ?? null,
        interests: user.profile ? parseInterests(user.profile.interests) : [],
      },
    });
  });
}
