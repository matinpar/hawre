export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const PREFERRED_GENDERS = ['MALE', 'FEMALE', 'ANY'] as const;
export const ACTION_TYPES = ['LIKE', 'PASS'] as const;
export const REPORT_REASONS = [
  'INAPPROPRIATE',
  'FAKE',
  'HARASSMENT',
  'SCAM',
  'THREAT',
  'OTHER',
] as const;
export const REPORT_STATUSES = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'] as const;
export const ACCOUNT_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'مرد',
  FEMALE: 'زن',
  OTHER: 'دیگر',
  ANY: 'همه',
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE: 'محتوای نامناسب',
  FAKE: 'حساب جعلی',
  HARASSMENT: 'مزاحمت',
  SCAM: 'کلاهبرداری',
  THREAT: 'رفتار تهدیدآمیز',
  OTHER: 'سایر',
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار بررسی',
  REVIEWING: 'در حال بررسی',
  RESOLVED: 'رسیدگی‌شده',
  REJECTED: 'رد شده',
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  DISABLED: 'غیرفعال',
  DELETED: 'حذف‌شده',
};

export const INTEREST_SUGGESTIONS = [
  'کتاب',
  'موسیقی',
  'سفر',
  'کوهنوردی',
  'سینما',
  'آشپزی',
  'عکاسی',
  'ورزش',
  'بازی',
  'هنر',
  'طبیعت‌گردی',
  'برنامه‌نویسی',
  'شطرنج',
  'دویدن',
  'یوگا',
  'قهوه',
  'تئاتر',
  'حیوانات',
];

export const CITIES = [
  'تهران',
  'مشهد',
  'اصفهان',
  'شیراز',
  'تبریز',
  'کرج',
  'رشت',
  'یزد',
  'اهواز',
  'کرمان',
  'قم',
  'همدان',
];

export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MIN_AGE = 18;

/* ---------- تأیید هویت سبک ---------- */

/** ژست‌های ساده و قابل‌تشخیص برای سلفیِ تأیید هویت */
export const VERIFICATION_GESTURES = [
  'دست راست را کنار گوش راست بگیرید',
  'با دست چپ علامت پیروزی (✌) نشان دهید',
  'کف دست راست را رو به دوربین باز کنید',
  'انگشت شست دست راست را بالا بگیرید',
  'دست چپ را روی شانه راست بگذارید',
];

/** انتخاب پایدار ژست بر اساس شناسه کاربر (هر کاربر همیشه همان ژست را می‌بیند) */
export function pickGesture(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) % 100000;
  return VERIFICATION_GESTURES[hash % VERIFICATION_GESTURES.length];
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  NONE: 'تأیید نشده',
  PENDING: 'در صف بررسی',
  APPROVED: 'تأییدشده',
  REJECTED: 'رد شده',
};
