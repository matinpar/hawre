import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import LandingContent from '@/components/LandingContent';

/**
 * صفحه نخست: بررسی نشست در سمت سرور انجام می‌شود و محتوای بازاریابی
 * در یک کامپوننت کلاینت است تا بتواند از سوییچ زبان استفاده کند.
 */
export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.profile?.profileCompleted ? '/discover' : '/onboarding');

  return <LandingContent />;
}
