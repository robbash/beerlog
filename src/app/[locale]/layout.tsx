import '@/app/globals.css';

import { NextIntlClientProvider } from 'next-intl';
import Link from 'next/link';
import { auth } from '@/lib/server/auth';
import { Button } from '@/components/ui/button';
import { Metadata, Viewport } from 'next';
import { Globals, Roles } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Toaster } from '@/components/ui/sonner';
import { LanguageSelector } from '@/components/language-selector';
import { MobileNav } from '@/components/mobile-nav';
import { logout } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: Globals.title,
  description: Globals.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function Layout({
  children,
  params,
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations();

  const session = await auth();

  const isPrivileged = session?.user?.role === Roles.Admin || session?.user?.role === Roles.Manager;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <header className="border-b bg-gray-100">
            <div className="container m-auto flex h-14 items-center justify-between px-3">
              <Link href={`/${locale}`} className="flex gap-2 font-semibold">
                <Image
                  unoptimized
                  src="/beerlog-icon.png"
                  alt={Globals.title}
                  height={24}
                  width={24}
                />
                <span>{Globals.title}</span>
              </Link>
              <nav>
                <div className="flex items-center gap-2">
                  {session?.user ? (
                    <>
                      {session?.user.firstName && (
                        <div className="p-2 text-sm text-gray-500 italic">
                          {t('navigation.greetings', { name: session.user.firstName })}
                        </div>
                      )}

                      <div className="hidden items-center gap-2 md:flex">
                        {(session?.user.role === Roles.Admin ||
                          session?.user.role === Roles.Manager) && (
                          <>
                            <Link href={`/${locale}/payments`}>
                              <Button variant="ghost" size="sm">
                                {t('navigation.payments')}
                              </Button>
                            </Link>

                            <Link href={`/${locale}/reminders`}>
                              <Button variant="ghost" size="sm">
                                {t('navigation.reminders')}
                              </Button>
                            </Link>
                          </>
                        )}

                        {session?.user.role === Roles.Admin && (
                          <>
                            <Link href={`/${locale}/users`}>
                              <Button variant="ghost" size="sm">
                                {t('navigation.users')}
                              </Button>
                            </Link>

                            <Link href={`/${locale}/admin/settings`}>
                              <Button variant="ghost" size="sm">
                                {t('navigation.admin')}
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>

                      <LanguageSelector userId={+session.user.id} />

                      {/* Users without extra sections get the logout button
                          straight away rather than a one-item burger. */}
                      <form action={logout} className={isPrivileged ? 'hidden md:block' : ''}>
                        <Button variant="outline" type="submit" size="sm">
                          {t('navigation.logout')}
                        </Button>
                      </form>

                      {isPrivileged && (
                        <div className="md:hidden">
                          <MobileNav locale={locale} role={session.user.role} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <LanguageSelector />

                      <Link href={`/${locale}/register`}>
                        <Button variant="ghost">{t('navigation.register')}</Button>
                      </Link>

                      <Link href={`/${locale}/login`}>
                        <Button>Login</Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </header>
          <main className="container m-auto px-3 py-6">{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
