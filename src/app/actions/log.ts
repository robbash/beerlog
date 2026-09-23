'use server';

import { auth } from '@/lib/server/auth';
import { Roles } from '@/lib/constants';
import { logSchema } from '@/lib/forms.schema';
import { prisma } from '@/lib/server/prisma';
import { getBeerPriceCents } from '@/lib/server/settings';
import { BeerLog, Prisma } from '@prisma/client';

export type Result = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  values?: BeerLogFormData;
};

export type BeerLogFormData = {
  id?: number;
  date?: string;
  quantity?: number;
  userId?: number;
};

export async function saveLog(formData: BeerLogFormData): Promise<Result> {
  // Auth check must happen before any data processing
  const session = await auth();

  if (!session) {
    return {
      ok: false,
      errors: { '401': ['not authorized'] },
    };
  }

  const parsed = logSchema.safeParse(formData);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();

    return {
      ok: false,
      errors: fieldErrors,
      formError: formErrors.join(' '),
      values: formData,
    };
  }

  const user = session.user!;
  const userId = user.role === Roles.User || !parsed.data.userId ? +user.id : parsed.data.userId;

  const beerPriceCents = await getBeerPriceCents();

  const data: Partial<BeerLog> = {
    date: parsed.data.date,
    quantity: parsed.data.quantity,
    costCentsAtTime: parsed.data.quantity * beerPriceCents,
    updatedAt: new Date(),
    updatedById: +user.id,
  };

  try {
    if (formData.id) {
      await prisma.beerLog.update({
        where: { id: +formData.id, userId },
        data,
      });
    } else {
      // Upsert on (userId, date) to prevent duplicate rows from double
      // submissions / retries. On conflict we increment quantity + cost
      // rather than create a second row for the same day.
      const quantity = parsed.data.quantity!;
      const addedCostCents = quantity * beerPriceCents;

      await prisma.beerLog.upsert({
        where: { userId_date: { userId, date: parsed.data.date! } },
        create: {
          userId,
          date: parsed.data.date!,
          quantity,
          costCentsAtTime: addedCostCents,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdById: +user.id,
          updatedById: +user.id,
        },
        update: {
          quantity: { increment: quantity },
          costCentsAtTime: { increment: addedCostCents },
          updatedAt: new Date(),
          updatedById: +user.id,
        },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        ok: false,
        formError:
          'A log entry for this user and date already exists. Please edit that entry instead.',
        values: formData,
      };
    }

    console.error('[saveLog] Database error:', error);
    return {
      ok: false,
      formError: 'Failed to save log entry. Please try again.',
      values: formData,
    };
  }

  return { ok: true };
}
