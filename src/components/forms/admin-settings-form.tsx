'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, LoaderCircle, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { saveSettings } from '@/app/actions/settings';
import DatePicker from '@/components/date-picker';
import { format } from 'date-fns';
import { dateFormat } from '@/lib/constants';

interface Defaults {
  beerPriceCents: number;
  summerGamesStartDate: string;
  summerGamesDurationWeeks: number;
  summerGamesFeeCents: number;
}

interface Props {
  defaults: Defaults;
}

export function AdminSettingsForm({ defaults }: Props) {
  const t = useTranslations('pages.admin.settings');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [beerPriceEuros, setBeerPriceEuros] = useState<string>(
    (defaults.beerPriceCents / 100).toFixed(2),
  );
  const [startDate, setStartDate] = useState<string>(defaults.summerGamesStartDate);
  const [durationWeeks, setDurationWeeks] = useState<number>(defaults.summerGamesDurationWeeks);
  const [feeEuros, setFeeEuros] = useState<string>((defaults.summerGamesFeeCents / 100).toFixed(2));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const beerPriceCents = Math.round(parseFloat(beerPriceEuros || '0') * 100);
      const summerGamesFeeCents = Math.round(parseFloat(feeEuros || '0') * 100);

      const result = await saveSettings({
        beerPriceCents,
        summerGamesStartDate: startDate,
        summerGamesDurationWeeks: durationWeeks,
        summerGamesFeeCents,
      });

      if (!result.ok) {
        throw new Error(result.formError || 'Failed to save');
      }

      setSuccess(t('success'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{t('error.title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-600 bg-green-50 text-green-800">
          <AlertTitle>{success}</AlertTitle>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('beerPrice.title')}</CardTitle>
          <CardDescription>{t('beerPrice.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Label htmlFor="beerPriceEuros">{t('beerPrice.label')}</Label>
            <Input
              id="beerPriceEuros"
              type="number"
              step="0.01"
              min="0"
              value={beerPriceEuros}
              onChange={(e) => setBeerPriceEuros(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="size-5 text-green-600" />
            {t('summerGames.title')}
          </CardTitle>
          <CardDescription>{t('summerGames.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label>{t('summerGames.startDate')}</Label>
            <DatePicker
              defaultValue={startDate ? new Date(`${startDate}T00:00:00`) : undefined}
              onSelect={(d) => setStartDate(format(d, dateFormat))}
              disabledDate={() => false}
            />
            <p className="text-muted-foreground text-xs">{t('summerGames.startDateHint')}</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="durationWeeks">{t('summerGames.durationWeeks')}</Label>
            <Input
              id="durationWeeks"
              type="number"
              min={1}
              max={52}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="feeEuros">{t('summerGames.fee')}</Label>
            <Input
              id="feeEuros"
              type="number"
              step="0.01"
              min={0}
              value={feeEuros}
              onChange={(e) => setFeeEuros(e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <LoaderCircle className="animate-spin" />}
        {t('button.submit')}
      </Button>
    </form>
  );
}
