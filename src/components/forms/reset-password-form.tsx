'use client';

import { z } from 'zod/v4';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { resetPassword, verifyResetToken } from '@/app/actions/password-reset';
import { AlertCircleIcon, LoaderCircle, Lock } from 'lucide-react';
import { passwordPatterns } from '@/lib/password.schema';

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const t = useTranslations('pages.resetPassword');
  const tError = useTranslations('errors');

  const router = useRouter();

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const result = await verifyResetToken(token);

      setTokenValid(result.valid);

      setIsVerifying(false);
    };

    verifyToken();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schema = z.object({ password: passwordPatterns });

    const validationResult = schema.safeParse({ password, passwordConfirmation });
    if (!validationResult.success) {
      setError(tError(`password.${validationResult.error?.issues[0]?.message}`));

      return;
    }

    if (password !== passwordConfirmation) {
      setError(tError('password.mismatch'));

      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await resetPassword(token, password);

    if (result.success) {
      setSuccess(t('success'));

      setPassword('');
      setPasswordConfirmation('');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      setError(result.error || t('errorMessage'));
    }

    setIsLoading(false);
  };

  if (isVerifying) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">{t('verifying')}</p>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{t('error.title')}</AlertTitle>
            <AlertDescription>
              <p>{t('invalidToken')}</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="password">{t('form.password')}</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('form.passwordPlaceholder')}
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">{t('form.passwordConfirmation')}</Label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder={t('form.passwordConfirmationPlaceholder')}
                  required
                  disabled={isLoading}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>{t('error.title')}</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-600 bg-green-50 text-green-800">
                <AlertTitle>{success}</AlertTitle>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <LoaderCircle className="animate-spin" />}
              {t('button.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
