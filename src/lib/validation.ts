import { z } from 'zod';
import { ACTION_TYPES, GENDERS, MIN_AGE, PREFERRED_GENDERS, REPORT_REASONS } from './constants';

export const emailSchema = z
  .string({ message: 'ایمیل الزامی است.' })
  .trim()
  .toLowerCase()
  .min(1, 'ایمیل الزامی است.')
  .max(254, 'ایمیل بیش از حد طولانی است.')
  .email('قالب ایمیل معتبر نیست.');

export const passwordSchema = z
  .string({ message: 'رمز عبور الزامی است.' })
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
  .max(72, 'رمز عبور نباید بیش از ۷۲ کاراکتر باشد.')
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
    message: 'رمز عبور باید شامل حروف و عدد باشد.',
  });

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: 'پذیرش قوانین و حریم خصوصی الزامی است.' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'رمز عبور و تکرار آن یکسان نیستند.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'رمز عبور الزامی است.'),
  remember: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, 'لینک بازیابی نامعتبر است.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'رمز عبور و تکرار آن یکسان نیستند.',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'رمز عبور جدید و تکرار آن یکسان نیستند.',
    path: ['confirmPassword'],
  });

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ تولد نامعتبر است.')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'تاریخ تولد نامعتبر است.')
  .refine((v) => {
    const age = ageFromBirthDate(new Date(v));
    return age >= MIN_AGE && age <= 100;
  }, `برای استفاده از این سرویس باید حداقل ${MIN_AGE} سال داشته باشید.`);

export const profileBaseSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'نام نمایشی باید حداقل ۲ کاراکتر باشد.')
      .max(40, 'نام نمایشی نباید بیش از ۴۰ کاراکتر باشد.'),
    birthDate: birthDateSchema,
    gender: z.enum(GENDERS, { message: 'جنسیت را انتخاب کنید.' }),
    preferredGender: z.enum(PREFERRED_GENDERS, { message: 'ترجیح جنسیتی را انتخاب کنید.' }),
    city: z.string().trim().min(2, 'شهر را وارد کنید.').max(40, 'نام شهر طولانی است.'),
    bio: z.string().trim().max(500, 'معرفی نباید بیش از ۵۰۰ کاراکتر باشد.').default(''),
    interests: z.array(z.string().trim().min(1).max(24)).max(10, 'حداکثر ۱۰ علاقه‌مندی مجاز است.').default([]),
    ageMin: z.number().int().min(18, 'حداقل سن نمی‌تواند کمتر از ۱۸ باشد.').max(100),
    ageMax: z.number().int().min(18).max(100),
    maxDistance: z.number().int().min(1).max(500).default(50),
  })
  ;

export const profileSchema = profileBaseSchema.refine((d) => d.ageMin <= d.ageMax, {
  message: 'حداقل سن نمی‌تواند از حداکثر سن بیشتر باشد.',
  path: ['ageMax'],
});

export const profilePatchSchema = profileBaseSchema.partial();

export const actionSchema = z.object({
  toUserId: z.string().min(1, 'کاربر مقصد مشخص نیست.'),
  actionType: z.enum(ACTION_TYPES).optional(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'متن پیام نمی‌تواند خالی باشد.')
    .max(1000, 'پیام نباید بیش از ۱۰۰۰ کاراکتر باشد.'),
});

export const reportSchema = z.object({
  reportedUserId: z.string().min(1, 'کاربر گزارش‌شونده مشخص نیست.'),
  reason: z.enum(REPORT_REASONS, { message: 'دلیل گزارش را انتخاب کنید.' }),
  description: z.string().trim().max(1000, 'توضیحات نباید بیش از ۱۰۰۰ کاراکتر باشد.').default(''),
});

export const settingsSchema = z.object({
  showDistance: z.boolean().optional(),
  notifyMatches: z.boolean().optional(),
  notifyMessages: z.boolean().optional(),
  discoverable: z.boolean().optional(),
  showOnline: z.boolean().optional(),
  email: emailSchema.optional(),
});

export const deleteAccountSchema = z.object({
  confirm: z.literal('حذف حساب', { message: 'برای تأیید، عبارت «حذف حساب» را وارد کنید.' }),
});

export function ageFromBirthDate(date: Date) {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
  return age;
}
