import { Logo } from '@/components/ui';

/** اسکلت بارگذاری سراسری — به‌جای صفحه سفید هنگام جابه‌جایی بین صفحات */
export default function Loading() {
  return (
    <div className="nv-bg flex min-h-screen flex-col items-center justify-center gap-5" role="status" aria-label="در حال بارگذاری">
      <div className="animate-pulse">
        <Logo size="lg" />
      </div>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-plum-100/70">
        <div className="h-full w-1/3 animate-[shimmer_1.2s_infinite] rounded-full bg-brand-grad" />
      </div>
    </div>
  );
}
