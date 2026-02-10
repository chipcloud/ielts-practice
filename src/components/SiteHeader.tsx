'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', key: 'nav.home' },
  { href: '/exams', key: 'nav.exams' },
  { href: '/dashboard', key: 'nav.dashboard', auth: true },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* ── Left: Logo + Nav Links ── */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary font-bold text-lg shrink-0"
            >
              <GraduationCap className="h-6 w-6" />
              <span className="hidden sm:inline">IELTS Practice</span>
            </Link>

            <div className="hidden sm:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                if (item.auth && !session) return null;
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-sm',
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground',
                    )}
                    asChild
                  >
                    <Link href={item.href}>{t(item.key)}</Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* ── Right: Theme + Lang + Auth ── */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />

            {status === 'loading' ? (
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            ) : session ? (
              <>
                <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                  <Link href="/dashboard">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">
                      {session.user?.email?.split('@')[0]}
                    </span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  title={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">{t('nav.login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
