import { getTranslations } from 'next-intl/server';
import { findLogReminderTargetByToken } from '@/lib/server/log-reminders';
import { NoDrinksConfirmation } from '@/components/forms/no-drinks-confirmation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function Page({ params }: Props) {
  const { token } = await params;

  const t = await getTranslations('pages.noDrinks');

  const target = await findLogReminderTargetByToken(token);

  if (!target) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('invalid')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <NoDrinksConfirmation
      token={token}
      date={target.reminder.date}
      alreadyConfirmed={target.noDrinksAt !== null}
    />
  );
}
