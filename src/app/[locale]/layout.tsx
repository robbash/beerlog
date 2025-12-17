import '@/app/globals.css';

import { NextIntlClientProvider } from 'next-intl';
import Link from 'next/link';
import { auth, signOut } from '@/lib/server/auth';
import { Button } from '@/components/ui/button';
import { Metadata, Viewport } from 'next';
import { Globals, Roles } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Wallet, Users as UsersIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

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
                {Globals.title}
              </Link>
              <nav>
                {session?.user ? (
                  <div className="flex items-center gap-2">
                    {session?.user.firstName && (
                      <div className="p-2 text-sm text-gray-500 italic">
                        {t('navigation.greetings', { name: session.user.firstName })}
                      </div>
                    )}

                    {(session?.user.role === Roles.Admin ||
                      session?.user.role === Roles.Manager) && (
                      <Link href={`/${locale}/payments`}>
                        <Button variant="ghost" size="sm">
                          <span className="hidden md:inline">{t('navigation.payments')}</span>
                          <Wallet className="h-4 w-4 md:hidden" />
                        </Button>
                      </Link>
                    )}

                    {session?.user.role === Roles.Admin && (
                      <Link href={`/${locale}/users`}>
                        <Button variant="ghost" size="sm">
                          <span className="hidden md:inline">{t('navigation.users')}</span>
                          <UsersIcon className="h-4 w-4 md:hidden" />
                        </Button>
                      </Link>
                    )}

                    <form
                      action={async () => {
                        'use server';
                        await signOut();
                      }}
                    >
                      <Button variant="outline" type="submit" size="sm">
                        {t('navigation.logout')}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <>
                    <Link href={`/${locale}/register`}>
                      <Button variant="ghost">{t('navigation.register')}</Button>
                    </Link>

                    <Link href={`/${locale}/login`}>
                      <Button>Login</Button>
                    </Link>
                  </>
                )}
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
