import { getTranslations } from 'next-intl/server';

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
