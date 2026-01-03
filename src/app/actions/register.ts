'use server';

import { Roles } from '@/lib/constants';
import { sendEmail } from '@/lib/server/email';
import { prisma } from '@/lib/server/prisma';
import bcrypt from 'bcryptjs';
import {
  getWelcomeEmail,
  getNewUserRegistrationEmail,
} from '@/lib/server/email-templates';

export async function registerAccount(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  locale?: string,
): Promise<boolean> {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userLocale = locale && ['en', 'de'].includes(locale) ? locale : 'en';
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: Roles.User,
        locale: userLocale,
      },
    });

    if (user) {
      const welcomeEmail = await getWelcomeEmail({
        firstName: user.firstName,
        locale: userLocale as 'en' | 'de',
      });
      const result = await sendEmail(email, welcomeEmail.subject, welcomeEmail.body);

      const managers = await prisma.user.findMany({
        select: { email: true, locale: true },
        where: { role: { in: [Roles.Manager, Roles.Admin] } },
      });

      for (const manager of managers) {
        const notificationEmail = await getNewUserRegistrationEmail({
          locale: (manager.locale as 'en' | 'de') || 'en',
        });
        await sendEmail(manager.email, notificationEmail.subject, notificationEmail.body);
      }

      return !!result.response;
    }
  } catch (ex) {
    console.warn(ex);
  }

  return false;
}
