'use server';

import { signIn } from '@/lib/server/auth';
import { sendEmail } from '@/lib/server/email';
import { prisma } from '@/lib/server/prisma';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getApprovalEmail } from '@/lib/server/email-templates';

export type LoginFormState = {
  error: string | undefined;
};

export async function loginAction(formData: FormData, locale?: string): Promise<LoginFormState> {
  'use server';

  try {
    // signIn will throw a redirect that we cannot use here. Therefore need to
    // catch and handle appropriately.
    await signIn('credentials', formData);
  } catch (error) {
    if (!isRedirectError(error)) {
      return { error: 'invalidCredentials' };
    }
  }

  if (locale) {
    const user = await prisma.user.findFirst({ where: { email: formData.get('email') as string } });
    await updateUserLocale(user?.id, locale);
  }

  return { error: undefined };
}

export async function userEmailExists(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });

  if (user) {
    return true;
  }

  return false;
}

export async function setUserApproved(id: number, approved: boolean) {
  const user = await prisma.user.update({ data: { approved }, where: { id } });

  if (user.approved === approved) {
    if (approved) {
      const approvalEmail = await getApprovalEmail({
        firstName: user.firstName,
        locale: (user.locale as 'en' | 'de') || 'en',
      });
      sendEmail(user.email, approvalEmail.subject, approvalEmail.body);
    }
    return true;
  }

  return false;
}

export async function deleteUser(id: number) {
  const [, user] = await prisma.$transaction([
    prisma.beerLog.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  if (user) {
    return true;
  }

  return false;
}

export async function updateUserLocale(userId?: number, locale?: string) {
  if (!['en', 'de'].includes(locale ?? '') || !userId) {
    return false;
  }

  // Check if user exists first, then update
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { locale },
  });

  return true;
}
