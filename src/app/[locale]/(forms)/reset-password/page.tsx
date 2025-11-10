import { ResetPasswordForm } from '@/components/forms/reset-password-form';
import { redirect } from 'next/navigation';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token || typeof token !== 'string') {
    redirect('/login');
  }

  return <ResetPasswordForm token={token} />;
}
