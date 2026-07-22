'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, LoaderCircle, Volleyball } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logParticipation } from '@/app/actions/summer-games';
import DatePicker from '@/components/date-picker';
import { format } from 'date-fns';
import { dateFormat } from '@/lib/constants';

interface UserOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface Props {
  title: string;
  description: string;
  submitLabel: string;
  cancelLabel: string;
  successLabel: string;
  errorTitle: string;
  dateLabel: string;
  dateHint: string;
  feeLabel: string;
  userLabel: string;
  userPlaceholder: string;
  alreadyLoggedLabel: string;
  feeCents: number;
  isoYear: number;
  isoWeek: number;
  weekStart: string;
  weekEnd: string;
  suggestedDate: string;
  dateLocked: boolean;
  targetUserId: number;
  users?: UserOption[];
  alreadyLoggedUserIds: number[];
}

export function SummerGamesParticipationForm(props: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(props.suggestedDate);
  const [userId, setUserId] = useState<number>(props.targetUserId);

  const weekStartDate = new Date(`${props.weekStart}T00:00:00`);
  const weekEndDate = new Date(`${props.weekEnd}T23:59:59`);

  const feeEuros = (props.feeCents / 100).toFixed(2);
  const alreadyLogged = userId > 0 && props.alreadyLoggedUserIds.includes(userId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await logParticipation({
        userId: userId || undefined,
        isoYear: props.isoYear,
        isoWeek: props.isoWeek,
        sessionDate: props.dateLocked ? undefined : sessionDate,
      });

      if (!result.ok) {
        throw new Error(result.formError || props.errorTitle);
      }

      setSuccess(props.successLabel);
      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Volleyball className="size-6 text-green-600" />
          {props.title}
        </CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>{props.errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}

          {props.users && (
            <div className="grid gap-3">
              <Label>{props.userLabel}</Label>
              <Select
                value={userId ? String(userId) : ''}
                onValueChange={(v) => setUserId(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={props.userPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {props.users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.firstName} {u.lastName}
                      {props.alreadyLoggedUserIds.includes(u.id) ? ' \u2713' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3">
            <Label>{props.dateLabel}</Label>
            <DatePicker
              defaultValue={sessionDate ? new Date(`${sessionDate}T00:00:00`) : undefined}
              onSelect={(d) => setSessionDate(format(d, dateFormat))}
              disabled={props.dateLocked}
              disabledDate={(d) => d < weekStartDate || d > weekEndDate}
            />
            <p className="text-muted-foreground text-xs">{props.dateHint}</p>
          </div>

          <div className="text-muted-foreground rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>{props.feeLabel}</span>
              <span className="text-foreground font-medium">{feeEuros} EUR</span>
            </div>
          </div>

          {alreadyLogged && (
            <Alert>
              <AlertTitle>{props.alreadyLoggedLabel}</AlertTitle>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || alreadyLogged}>
            {isLoading && <LoaderCircle className="animate-spin" />}
            <Volleyball className="mr-1 size-4" />
            {props.submitLabel}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => router.push('/')}
          >
            {props.cancelLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
