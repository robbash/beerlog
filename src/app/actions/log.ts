'use server';

import { auth } from '@/lib/auth';
import { Roles } from '@/lib/constants';
import { logSchema } from '@/lib/forms';
import { prisma } from '@/lib/prisma';
import { getBeerPriceCents } from '@/lib/settings';
import { BeerLog } from '@prisma/client';

export type Result = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  values?: BeerLogFormData;
};

export type BeerLogFormData = {
  id?: number;
  date?: Date;
  quantity?: number;
  userId?: number;
};

export async function saveLog(formData: BeerLogFormData): Promise<Result> {
  const session = await auth();
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

  if (!session) {
    return {
      ok: false,
      errors: { '401': ['not authorized'] },
    };
  }

  const user = session.user!;
  const userId = user.role === Roles.User ? +user.id : parsed.data.userId;

  const data: Partial<BeerLog> = {
    date: new Date(parsed.data.date),
    quantity: parsed.data.quantity,
    updatedAt: new Date(),
    updatedById: +user.id,
  };

  if (formData.id) {
    await prisma.beerLog.update({
      where: { id: +formData.id, userId },
      data,
    });
  } else {
    await prisma.beerLog.create({
      data: {
        ...data,
        userId,
        createdAt: new Date(),
        createdById: +user.id,
        costCentsAtTime: parsed.data.quantity * (await getBeerPriceCents()),
      } as BeerLog,
    });
  }

  return { ok: true };
}
