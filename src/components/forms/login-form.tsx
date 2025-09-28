import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import Link from 'next/link';

export function LoginForm() {
  const t = useTranslations('pages.login');

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            'use server';

            try {
              await signIn('credentials', formData);
            } catch (error) {
              if (error instanceof AuthError) {
                // return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`)
              }

              throw error;
            }
          }}
        >
          <div className="grid gap-6">
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
