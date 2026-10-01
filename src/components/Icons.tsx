/**
 * مجموعه آیکون‌های خطی پروژه هاوڕێ.
 * همه آیکون‌ها SVG درون‌خطی و بدون وابستگی خارجی هستند (سبک، قابل رنگ‌آمیزی با currentColor).
 */
type IconProps = { className?: string; size?: number; strokeWidth?: number };

function base(size = 20, className = '', strokeWidth = 1.8) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

export const IconCompass = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.2 8.8-1.8 4.4-4.4 1.8 1.8-4.4z" />
  </svg>
);

export const IconHeart = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M12 20.3 4.8 13.4a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.5.5.5-.5a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6z" />
  </svg>
);

export const IconHeartFilled = ({ className, size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 20.7 4.6 13.6a4.9 4.9 0 0 1 0-7 5.1 5.1 0 0 1 7.1 0l.3.3.3-.3a5.1 5.1 0 0 1 7.1 0 4.9 4.9 0 0 1 0 7z" />
  </svg>
);

export const IconChat = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M20 12.5a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.4-.3-3.4-.8L4 20.5l1.4-4.3A7.5 7.5 0 1 1 20 12.5z" />
    <path d="M9 11.5h6M9 14.5h4" />
  </svg>
);

export const IconUser = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.8 19.6a7.2 7.2 0 0 1 14.4 0" />
  </svg>
);

export const IconSettings = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
);

export const IconShield = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M12 3.2 5 6v5.4c0 4.2 2.9 8.1 7 9.4 4.1-1.3 7-5.2 7-9.4V6z" />
    <path d="m9.2 12.2 2 2 3.6-3.8" />
  </svg>
);

export const IconSparkle = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
    <path d="M18.5 3.5v3M20 5h-3" />
  </svg>
);

export const IconClose = ({ className, size, strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const IconUndo = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M4 9h9.5a5.5 5.5 0 0 1 0 11H9" />
    <path d="M7.5 5.5 4 9l3.5 3.5" />
  </svg>
);

export const IconSearch = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const IconCheck = ({ className, size, strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconArrowLeft = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const IconArrowRight = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconLogout = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M14.5 8.2V6.4A2.4 2.4 0 0 0 12.1 4H6.4A2.4 2.4 0 0 0 4 6.4v11.2A2.4 2.4 0 0 0 6.4 20h5.7a2.4 2.4 0 0 0 2.4-2.4v-1.8" />
    <path d="M20 12H9.5M17 8.8l3.2 3.2-3.2 3.2" />
  </svg>
);

export const IconCamera = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M4 8.8h3l1.4-2.3h7.2L17 8.8h3a1 1 0 0 1 1 1v8.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.8a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.6" r="3.3" />
  </svg>
);

export const IconLock = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.6" />
    <path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" />
  </svg>
);

export const IconMail = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <rect x="3" y="5.5" width="18" height="13" rx="3" />
    <path d="m4.5 8 6.4 4.4a2 2 0 0 0 2.2 0L19.5 8" />
  </svg>
);

export const IconPin = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M12 21s6.5-5.6 6.5-10.2a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10.6" r="2.4" />
  </svg>
);

export const IconFlag = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M5.5 21V4.5" />
    <path d="M5.5 5.2h10.8l-1.6 3.4 1.6 3.4H5.5z" />
  </svg>
);

export const IconGrid = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <rect x="3.6" y="3.6" width="7" height="7" rx="2.2" />
    <rect x="13.4" y="3.6" width="7" height="7" rx="2.2" />
    <rect x="3.6" y="13.4" width="7" height="7" rx="2.2" />
    <rect x="13.4" y="13.4" width="7" height="7" rx="2.2" />
  </svg>
);

export const IconSend = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M20 4 3.8 10.4l6.4 2.4 2.4 6.4z" />
    <path d="m10.2 12.8 4-4" />
  </svg>
);

export const IconInfo = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.2M12 7.8h.01" />
  </svg>
);

export const IconWarn = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M12 4.2 2.9 19.4h18.2z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconGoogle = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.3-4.6 2.1-8.2 2.1-6.3 0-11.7-3.7-13.6-9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export const IconSun = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
);

export const IconMonitor = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <rect x="2.5" y="4" width="19" height="12.5" rx="2.5" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </svg>
);

export const IconFilter = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M3.5 6h17M6.5 12h11M10 18h4" />
  </svg>
);

export const IconDot = ({ className, size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10" className={className} aria-hidden>
    <circle cx="5" cy="5" r="4" fill="currentColor" />
  </svg>
);

export const IconVerified = ({ className, size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.6 1.6-1 2.9 1 2.9-2.6 1.6-1 2.9-3-.3L12 22.2l-2.4-1.9-3 .3-1-2.9L3 16.1l1-2.9-1-2.9 2.6-1.6 1-2.9 3 .3L12 1.8Z"
    />
    <path d="m8.4 12.2 2.5 2.4 4.7-4.8" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconIdCard = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="3" />
    <circle cx="8.5" cy="11" r="2.2" />
    <path d="M5.5 16.2c.6-1.4 1.8-2.1 3-2.1s2.4.7 3 2.1M14.5 9.5h4M14.5 13h4" />
  </svg>
);

export const IconCheckDouble = ({ className, size, strokeWidth = 2.1 }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="m1.8 12.4 3.4 3.4 7.2-7.4" />
    <path d="m10.2 15.8 1.4 1.4 8-8.2" />
  </svg>
);

export const IconClock = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const IconMore = ({ className, size, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="5.5" r="1.3" fill="currentColor" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    <circle cx="12" cy="18.5" r="1.3" fill="currentColor" />
  </svg>
);

export const IconChevronDown = ({ className, size, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const IconTrash = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.5 6.5l.8 12c.05.8.7 1.4 1.5 1.4h6.4c.8 0 1.45-.6 1.5-1.4l.8-12" />
  </svg>
);

export const IconBan = ({ className, size, strokeWidth }: IconProps) => (
  <svg {...base(size, className, strokeWidth)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6.2 6.2 11.6 11.6" />
  </svg>
);
