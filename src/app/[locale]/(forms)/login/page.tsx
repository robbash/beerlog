import { LoginForm } from '@/components/forms/login-form';
import { auth } from '@/lib/server/auth';
import { redirectUriParam } from '@/lib/constants';
import { localRedirectPath } from '@/lib/utils/url';
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const redirectUri = localRedirectPath(params[redirectUriParam]);

  const session = await auth();

  if (session) {
    redirect(redirectUri ?? `/${await getLocale()}`);
  }

  return <LoginForm />;
}
