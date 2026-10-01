'use client';

import AppFrame from '@/components/AppFrame';
import AdminDashboard from '@/components/AdminDashboard';
import { PageHeader } from '@/components/ui';
import { IconGrid } from '@/components/Icons';

export default function AdminPage() {
  // کنترل نقش در سمت سرور روی همه APIهای /api/admin انجام می‌شود؛
  // این بررسی کلاینتی فقط برای تجربه کاربری است.
  return (
    <AppFrame requireProfile={false} requireAdmin>
      <PageHeader
        title="پنل مدیریت"
        subtitle="آمار کلی، مدیریت کاربران و رسیدگی به گزارش‌ها."
        icon={<IconGrid size={22} />}
      />
      <AdminDashboard />
    </AppFrame>
  );
}
