import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/server/auth';
import { isAdminOrManager } from '@/lib/server/authz';
import {
  getLogReminderIntervalHours,
  getLogReminderMaxCount,
  getLogReminders,
} from '@/lib/server/log-reminders';
import { LogReminderForm } from '@/components/forms/log-reminder-form';
import { LogRemindersTable } from '@/components/log-reminders-table';

export default async function Page() {
  const session = await auth();

  if (!session?.user || !isAdminOrManager(session.user)) {
    return redirect('/');
  }

  const t = await getTranslations('pages.reminders');

  const maxCount = getLogReminderMaxCount();
  const reminders = await getLogReminders();

  const campaigns = reminders.map((reminder) => ({
    id: reminder.id,
    date: reminder.date,
    label: reminder.label,
    active: reminder.active,
    total: reminder.targets.length,
    done: reminder.targets.filter(
      (target) => target.resolvedAt || target.noDrinksAt || target.sentCount >= maxCount,
    ).length,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {t('intervalHint', { hours: getLogReminderIntervalHours(), max: maxCount })}
        </p>
      </div>

      <LogReminderForm />

      <LogRemindersTable campaigns={campaigns} />
    </div>
  );
}
