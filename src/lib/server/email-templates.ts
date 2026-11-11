import { getTranslations } from 'next-intl/server';
import { format } from 'date-fns';
import { humanDateFormat } from '@/lib/constants';

type Locale = 'en' | 'de';

interface WelcomeEmailParams {
  firstName: string;
  locale: Locale;
}

interface ApprovalEmailParams {
  firstName: string;
  locale: Locale;
}

interface NewUserRegistrationEmailParams {
  locale: Locale;
}

interface PasswordResetEmailParams {
  firstName: string;
  resetLink: string;
  expiryHours: number;
  locale: Locale;
}

interface LogReminderEmailParams {
  firstName: string;
  eventDate: string;
  eventLabel?: string | null;
  logLink: string;
  noDrinksLink: string;
  locale: Locale;
}

export async function getWelcomeEmail({ firstName, locale }: WelcomeEmailParams) {
  const t = await getTranslations({ locale, namespace: 'emails.welcome' });

  return {
    subject: t('subject'),
    body: t('body', { firstName }),
  };
}

export async function getApprovalEmail({ firstName, locale }: ApprovalEmailParams) {
  const t = await getTranslations({ locale, namespace: 'emails.approval' });

  return {
    subject: t('subject'),
    body: t('body', { firstName }),
  };
}

export async function getNewUserRegistrationEmail({ locale }: NewUserRegistrationEmailParams) {
  const t = await getTranslations({ locale, namespace: 'emails.newUserRegistration' });

  return {
    subject: t('subject'),
    body: t('body'),
  };
}

export async function getPasswordResetEmail({
  firstName,
  resetLink,
  expiryHours,
  locale,
}: PasswordResetEmailParams) {
  const t = await getTranslations({ locale, namespace: 'emails.passwordReset' });

  return {
    subject: t('subject'),
    body: t('body', { firstName, resetLink, expiryHours }),
  };
}

export async function getLogReminderEmail({
  firstName,
  eventDate,
  eventLabel,
  logLink,
  noDrinksLink,
  locale,
}: LogReminderEmailParams) {
  const t = await getTranslations({ locale, namespace: 'emails.logReminder' });

  const event = format(new Date(`${eventDate}T00:00:00`), humanDateFormat);

  return {
    subject: eventLabel
      ? t('subjectWithLabel', { event, label: eventLabel })
      : t('subject', { event }),
    body: t('body', { firstName, event, logLink, noDrinksLink }),
  };
}
