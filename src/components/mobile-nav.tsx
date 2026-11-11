'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell, LogOut, Menu, Settings, Users, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Roles } from '@/lib/constants';
import { logout } from '@/app/actions/auth';

interface Props {
  locale: string;
  role?: string;
}

/**
 * Full-screen navigation overlay for small screens. The desktop bar keeps the
 * individual buttons; greeting and language selector stay in the top bar.
 */
export function MobileNav({ locale, role }: Props) {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  // The layout — and therefore this component — survives route changes, so we
  // remember which route the menu was opened on. As soon as the path changes
  // (link tap, back button) the overlay closes without needing an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);

  const isOpen = openedOn !== null && openedOn === pathname;
  const setOpen = (open: boolean) => setOpenedOn(open ? pathname : null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedOn(null);
    };

    // Growing past the `md` breakpoint hides the overlay via CSS, which would
    // otherwise leave the body scroll-locked for good.
    const wide = window.matchMedia('(min-width: 768px)');
    const onBreakpointChange = () => {
      if (wide.matches) setOpenedOn(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', onKeyDown);
    wide.addEventListener('change', onBreakpointChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      wide.removeEventListener('change', onBreakpointChange);
    };
  }, [isOpen]);

  const isAdmin = role === Roles.Admin;

  const links = [
    { href: `/${locale}/payments`, label: t('payments'), icon: Wallet },
    { href: `/${locale}/reminders`, label: t('reminders'), icon: Bell },
    ...(isAdmin
      ? [
          { href: `/${locale}/users`, label: t('users'), icon: Users },
          { href: `/${locale}/admin/settings`, label: t('admin'), icon: Settings },
        ]
      : []),
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('menu')}
        aria-expanded={isOpen}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('menu')}
          className="bg-background/95 animate-in fade-in-0 fixed inset-0 z-50 flex flex-col backdrop-blur-sm duration-150 md:hidden"
        >
          <nav className="animate-in slide-in-from-bottom-4 flex flex-1 flex-col items-center justify-center gap-1 duration-200">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="hover:text-primary flex items-center gap-3 px-8 py-4 text-2xl font-semibold transition-colors"
              >
                <Icon className="size-6" />
                {label}
              </Link>
            ))}

            <form action={logout} className="mt-8 flex w-full justify-center border-t pt-8">
              <Button variant="outline" size="lg" type="submit">
                <LogOut />
                {t('logout')}
              </Button>
            </form>

            <Button
              variant="ghost"
              size="icon"
              aria-label={t('close')}
              autoFocus
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground mt-10 size-16 rounded-full"
            >
              <X className="size-9" />
            </Button>
          </nav>
        </div>
      )}
    </>
  );
}
