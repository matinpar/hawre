import { handle, ok, parseBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { profileSchema, profilePatchSchema } from '@/lib/validation';
import { parseInterests, stringifyInterests } from '@/lib/serializers';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    const me = await requireUser();
    return ok({
      profile: me.profile
        ? { ...me.profile, interests: parseInterests(me.profile.interests), birthDate: me.profile.birthDate.toISOString().slice(0, 10) }
        : null,
      photos: me.photos.map((p) => ({ id: p.id, url: p.imageUrl, isPrimary: p.isPrimary, sortOrder: p.sortOrder })),
      email: me.email,
      settings: me.settings,
    });
  });
}

/** ایجاد/به‌روزرسانی کامل پروفایل (مرحله onboarding) */
export async function PUT(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await parseBody(req, profileSchema);
    const data = {
      displayName: sanitizeText(body.displayName),
      birthDate: new Date(body.birthDate),
      gender: body.gender,
      preferredGender: body.preferredGender,
      city: sanitizeText(body.city),
      bio: sanitizeText(body.bio ?? ''),
      interests: stringifyInterests((body.interests ?? []).map(sanitizeText)),
      ageMin: body.ageMin,
      ageMax: body.ageMax,
      maxDistance: body.maxDistance ?? 50,
      profileCompleted: true,
    };
    const photoCount = await prisma.profilePhoto.count({ where: { userId: me.id } });
    const profile = await prisma.profile.upsert({
      where: { userId: me.id },
      create: { userId: me.id, ...data, profileCompleted: photoCount > 0 },
      update: { ...data, profileCompleted: photoCount > 0 },
    });
    return ok({ profile: { ...profile, interests: parseInterests(profile.interests) }, needsPhoto: photoCount === 0 });
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const me = await requireUser();
    const body = await parseBody(req, profilePatchSchema);
    const data: Record<string, unknown> = {};
    if (body.displayName !== undefined) data.displayName = sanitizeText(body.displayName);
    if (body.birthDate !== undefined) data.birthDate = new Date(body.birthDate);
    if (body.gender !== undefined) data.gender = body.gender;
    if (body.preferredGender !== undefined) data.preferredGender = body.preferredGender;
    if (body.city !== undefined) data.city = sanitizeText(body.city);
    if (body.bio !== undefined) data.bio = sanitizeText(body.bio);
    if (body.interests !== undefined) data.interests = stringifyInterests(body.interests.map(sanitizeText));
    if (body.ageMin !== undefined) data.ageMin = body.ageMin;
    if (body.ageMax !== undefined) data.ageMax = body.ageMax;
    if (body.maxDistance !== undefined) data.maxDistance = body.maxDistance;

    const profile = await prisma.profile.update({ where: { userId: me.id }, data });
    return ok({ profile: { ...profile, interests: parseInterests(profile.interests) } });
  });
}
