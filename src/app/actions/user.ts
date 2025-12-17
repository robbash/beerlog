'use server';

import { signIn } from '@/lib/server/auth';
import { sendEmail } from '@/lib/server/email';
import { prisma } from '@/lib/server/prisma';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export type LoginFormState = {
  error: string | undefined;
};

export async function loginAction(formData: FormData): Promise<LoginFormState> {
  'use server';

  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (!isRedirectError(error)) {
      return { error: 'invalidCredentials' };
    }
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
      sendEmail(
        user.email,
        'Your account for BeerLog has been approved',
        'Hey there, good news - you can start using BeerLog now...',
      );
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
