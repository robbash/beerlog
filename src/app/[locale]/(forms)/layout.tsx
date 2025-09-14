import React from 'react';
import { cn } from '@/lib/utils';
import { FormFooter } from '@/components/forms/form-footer';
import Link from 'next/link';
import { CircleUser } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function PlainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations('app');

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className={cn('flex flex-col gap-6')}>
          <Link href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <CircleUser className="size-4" />
            </div>

            {t('title')}
          </Link>

          {children}

          <FormFooter />
        </div>
      </div>
    </div>
  );
}
