'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AlertCircleIcon, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { loginAction } from '@/app/actions/user';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const t = useTranslations('pages.login');
  const tError = useTranslations('errors');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setLoading(true);

    const result = await loginAction(formData);

    if (result.error) {
      setErrorMessage(result.error);

      setLoading(false);

      return;
    }

    const uri = params.get('redirect-uri');

    router.push(uri ?? '/');
    router.refresh();
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
                  <AlertDescription>{tError(errorMessage)}</AlertDescription>
                </Alert>
              </div>
            )}
            <div className="grid gap-3">
              <Label htmlFor="email">{t(`form.email`)}</Label>
              <Input
                name="email"
                type={'email'}
                placeholder={t(`form.emailPlaceholder`)}
                required
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">{t('form.password')}</Label>
              </div>
              <Input name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              {loading && (
                <>
                  <LoaderCircle className="animate-spin" />{' '}
                </>
              )}
              {t('button.signIn')}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/forgot-password"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                {t('button.forgotPassword')}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
