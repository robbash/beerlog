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

      const managerEmails = await prisma.user.findMany({
        select: { email: true },
        where: { role: { in: [Roles.Manager, Roles.Admin] } },
      });

      managerEmails.forEach(
        async (record) =>
          await sendEmail(
            record.email,
            'New user registration in BeerLog',
            'Hey there,\nA new user registered and is waiting to get approved.',
          ),
      );

      return !!result.response;
    }
  } catch (ex) {
    console.warn(ex);
  }

  return false;
}
