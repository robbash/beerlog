'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { BeerOff, LoaderCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { humanDateFormat } from '@/lib/constants';
import { confirmNoDrinks } from '@/app/actions/log-reminder';

interface Props {
  token: string;
  date: string;
  alreadyConfirmed: boolean;
}

export function NoDrinksConfirmation({ token, date, alreadyConfirmed }: Props) {
  const t = useTranslations('pages.noDrinks');
  const locale = useLocale();

  const [isConfirmed, setConfirmed] = useState(alreadyConfirmed);
  const [isLoading, setLoading] = useState(false);

  const event = format(new Date(`${date}T00:00:00`), humanDateFormat);

  async function onConfirm() {
    setLoading(true);

    const result = await confirmNoDrinks(token);

    setConfirmed(result.ok);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BeerOff className="size-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfirmed ? (
          <>
            <p className="text-sm text-green-700">{t('done', { event })}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/${locale}`}>{t('home')}</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">{t('description', { event })}</p>
            <Button className="w-full" onClick={onConfirm} disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin" />}
              {t('confirm')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
