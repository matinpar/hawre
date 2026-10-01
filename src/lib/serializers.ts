import { ageFromBirthDate } from './validation';

type PhotoLike = { id: string; imageUrl: string; isPrimary: boolean; sortOrder: number };
type ProfileLike = {
  displayName: string;
  isVerified?: boolean;
  birthDate: Date;
  gender: string;
  city: string;
  bio: string;
  interests: string;
};

export type PublicProfile = {
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  city: string;
  bio: string;
  interests: string[];
  photos: { id: string; url: string; isPrimary: boolean }[];
  distanceKm: number | null;
  lastActiveAt?: string;
  isVerified: boolean;
};

/**
 * تبدیل رکورد کاربر به داده‌ی عمومی.
 * هرگز email، passwordHash، googleId، نقش یا مختصات دقیق برگردانده نمی‌شود.
 */
export function toPublicProfile(
  user: { id: string; lastActiveAt?: Date; profile: ProfileLike | null; photos: PhotoLike[] },
  opts: { showDistance?: boolean } = {},
): PublicProfile | null {
  if (!user.profile) return null;
  return {
    userId: user.id,
    displayName: user.profile.displayName,
    age: ageFromBirthDate(user.profile.birthDate),
    gender: user.profile.gender,
    city: user.profile.city,
    bio: user.profile.bio,
    interests: parseInterests(user.profile.interests),
    isVerified: user.profile.isVerified === true,
    photos: [...user.photos]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
      .map((p) => ({ id: p.id, url: p.imageUrl, isPrimary: p.isPrimary })),
    // فاصله صرفاً تقریبی و شبه‌تصادفی بر پایه شناسه است (مکان دقیق ذخیره/نمایش نمی‌شود)
    distanceKm: opts.showDistance === false ? null : approximateDistance(user.id),
    lastActiveAt: user.lastActiveAt?.toISOString(),
  };
}

export function parseInterests(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stringifyInterests(list: string[]): string {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).join(',');
}

/** فاصله تقریبی و پایدار بر اساس هش شناسه؛ فقط برای نمایش دموی MVP */
function approximateDistance(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  return 1 + (hash % 45);
}
