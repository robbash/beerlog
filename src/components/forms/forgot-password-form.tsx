'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { requestPasswordReset } from '@/app/actions/password-reset';
import { AlertCircleIcon, LoaderCircle, Mail } from 'lucide-react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const t = useTranslations('pages.forgotPassword');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccess(t('success'));

      setEmail('');
    } else {
      setError(result.error || t('error.message'));
    }

    setIsLoading(false);
  };

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
              <Label htmlFor="email">{t('form.email')}</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('form.emailPlaceholder')}
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

            <div className="text-center text-sm">
              <Link href="/login" className="ml-auto text-sm underline-offset-4 hover:underline">
                {t('button.backToLogin')}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
