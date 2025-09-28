'use server';

import { signIn } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export type LoginFormState = {
  error: string | undefined;
};

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  'use server';

  try {
    await signIn('credentials', formData);

    return { error: undefined };
  } catch (error) {
    // if (error instanceof AuthError) {
    // return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`)
    // }
    return { error: 'invalidCredentials' };
  }
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
