'use client';

import { FormEvent, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { AlertCircleIcon, Bell, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DatePicker from '@/components/date-picker';
import { dateFormat } from '@/lib/constants';
import { loadReminderCandidates, startLogReminder } from '@/app/actions/log-reminder';
import type { ReminderCandidate } from '@/lib/server/log-reminders';

export function LogReminderForm() {
  const t = useTranslations('pages.reminders.form');

  const [date, setDate] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [candidates, setCandidates] = useState<ReminderCandidate[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [isLoadingCandidates, startLoading] = useTransition();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onDateSelected(picked: Date) {
    const next = format(picked, dateFormat);
    if (next === date) return;

    setDate(next);
    setSelected([]);
    setSuccess(null);
    setError(null);

    startLoading(async () => {
      setCandidates(await loadReminderCandidates(next));
    });
  }

  function toggle(userId: number) {
    setSelected((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selected.length) {
      setError(t('noSelection'));
      return;
    }

    setSubmitting(true);

    try {
      const result = await startLogReminder({
        date,
        label: label.trim() || undefined,
        userIds: selected,
      });

      if (!result.ok) {
        throw new Error(result.formError || 'Failed to start');
      }

      setSuccess(t('success', { count: result.addedCount ?? 0 }));
      setCandidates(candidates.filter((candidate) => !selected.includes(candidate.userId)));
      setSelected([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Label>{t('date')}</Label>
            <DatePicker onSelect={onDateSelected} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="label">{t('label')}</Label>
            <Input
              id="label"
              value={label}
              placeholder={t('labelPlaceholder')}
              maxLength={100}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {date && (
            <div className="grid gap-2">
              <Label>{t('candidates')}</Label>
              <p className="text-muted-foreground text-xs">{t('candidatesHint')}</p>

              {isLoadingCandidates ? (
                <LoaderCircle className="my-4 animate-spin self-center" />
              ) : candidates.length ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(candidates.map((c) => c.userId))}
                    >
                      {t('selectAll')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                      {t('clear')}
                    </Button>
                  </div>

                  <ul className="divide-y rounded-md border">
                    {candidates.map((candidate) => (
                      <li key={candidate.userId}>
                        <label className="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            className="size-4 accent-current"
                            checked={selected.includes(candidate.userId)}
                            onChange={() => toggle(candidate.userId)}
                          />
                          <span className="flex-1 text-sm font-medium">
                            {candidate.firstName} {candidate.lastName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {t('recentLogs', { count: candidate.recentLogCount })}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground py-2 text-sm">{t('empty')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting || !selected.length}>
        {isSubmitting && <LoaderCircle className="animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  );
}
