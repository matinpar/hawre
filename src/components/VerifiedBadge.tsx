import { IconVerified } from './Icons';

/** نشان «پروفایل تأییدشده» — کنار نام کاربر */
export default function VerifiedBadge({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      title="پروفایل تأییدشده"
      aria-label="پروفایل تأییدشده"
      className={`inline-flex shrink-0 align-middle text-sky-500 ${className}`}
    >
      <IconVerified size={size} />
    </span>
  );
}
