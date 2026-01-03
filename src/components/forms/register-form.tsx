'use client';

import { z } from 'zod/v4';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { passwordPatterns } from '@/lib/password.schema';
import { registerAccount } from '@/app/actions/register';
import { userEmailExists } from '@/app/actions/user';

export function RegisterForm() {
  const t = useTranslations('pages.register');
  const tError = useTranslations('errors');
  const locale = useLocale();

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const schema = z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.email(),
      password: passwordPatterns,
    });

    const validationResult = schema.safeParse(Object.fromEntries(formData.entries()));

    if (!validationResult.success) {
      setErrorMessage(tError(`password.${validationResult.error?.issues[0]?.message}`));

      return;
    }

    const { firstName, lastName, email, password } = validationResult.data;

    if (password !== formData.get('passwordConfirmation')) {
      setErrorMessage(tError('password.mismatch'));

      return;
    }

    setLoading(true);

    if (await userEmailExists(email)) {
      setErrorMessage(tError('userExists'));
      setLoading(false);

      return;
    }

    const result = await registerAccount(firstName, lastName, email, password, locale);

    if (result) {
      setErrorMessage(undefined);

      router.push('/');

      return;
    }

    setErrorMessage(tError('registrationFailed'));
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {errorMessage && (
              <div className="grid gap-3">
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="grid gap-3">
              <Label htmlFor="firstName">{t('form.firstName')}</Label>
              <Input name="firstName" required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="lastName">{t('form.lastName')}</Label>
              <Input name="lastName" required />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email">{t('form.email')}</Label>
              <Input name="email" type="email" placeholder={t('form.emailPlaceholder')} required />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">{t('form.password')}</Label>
              </div>
              <Input name="password" type="password" required />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="passwordConfirmation">{t('form.passwordConfirmation')}</Label>
              </div>
              <Input name="passwordConfirmation" type="password" required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && (
                <>
                  <LoaderCircle className="animate-spin" />{' '}
                </>
              )}
              {t('button.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
