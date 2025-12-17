import { RegisterForm } from '@/components/forms/register-form';
import { auth } from '@/lib/server/auth';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri: string | undefined }>;
}) {
  const { redirect_uri: redirectUri } = await searchParams;

  const session = await auth();

  if (session) {
    redirect(redirectUri ?? '/');
  }

  return <RegisterForm />;
}
