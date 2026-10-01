import Link from 'next/link';
import { Logo, Avatar } from './ui';
import { NavLinks, LogoutButton } from './Nav';
import { ThemeQuickToggle } from './ThemeToggle';

export type ShellUser = {
  displayName: string | null;
  photo: string | null;
  isAdmin: boolean;
};

export default function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const name = user.displayName ?? 'کاربر هاوڕێ';

  return (
    <div className="nv-bg min-h-screen">
      {/* هدر شیشه‌ای چسبان */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/discover" aria-label="صفحه اصلی هاوڕێ" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <nav aria-label="ناوبری اصلی" className="hidden md:block">
            <NavLinks isAdmin={user.isAdmin} variant="header" />
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 py-1 pl-3 pr-1 shadow-soft transition hover:border-brand-200"
            >
              <Avatar src={user.photo} name={name} size={32} />
              <span className="hidden max-w-[7rem] truncate text-sm font-bold text-slate-700 sm:inline">{name}</span>
            </Link>
            <ThemeQuickToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-36 pt-5 md:pb-14">
        {children}
      </main>

      {/* ناوبری شناور پایین در موبایل */}
      <nav
        aria-label="ناوبری پایین"
        className="fixed inset-x-3 bottom-3 z-30 rounded-[1.5rem] border border-white/70 bg-white/85 shadow-lift backdrop-blur-xl md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavLinks isAdmin={user.isAdmin} variant="bottom" />
      </nav>
    </div>
  );
}
