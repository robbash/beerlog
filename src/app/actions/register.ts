'use server';

import { Roles } from '@/lib/constants';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerAccount(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: Roles.User,
      },
    });

    if (user) {
      const result = await sendEmail(
        email,
        'Welcome to BeerLog',
        "Hey there,\nYour account has been created and is waiting for approval. You will receive an email when you're ready to go...",
      );

      return !!result.response;
    }
  } catch (ex) {
    console.warn(ex);
  }

  return false;
}
