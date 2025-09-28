'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { loginAction } from '@/app/actions/user';

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: undefined });

  const t = useTranslations('pages.login');
  const tError = useTranslations('errors');

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <div className="grid gap-6">
            {state.error && (
              <div className="grid gap-3">
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{tError(state.error)}</AlertDescription>
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
              {t('button.signIn')}
            </Button>
            <div className="text-center text-sm">
              <Link
                href="/reset-password"
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
