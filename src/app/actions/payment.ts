'use server';

import { auth } from '@/lib/auth';
import { Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { applyExistingCredits, getUserBalanceDetails } from '@/lib/payments';
import { z } from 'zod';

const paymentSchema = z.object({
  userId: z.number().int().positive(),
  amountCents: z.number().int().positive(),
  currency: z.string().default('EUR'),
  note: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export type PaymentResult = {
  ok: boolean;
  errors?: Record<string, string[]>;
  formError?: string;
  values?: PaymentFormData;
  paymentId?: number;
};

/**
 * Record a payment and allocate it to unpaid beer logs
 */
export async function recordPayment(formData: PaymentFormData): Promise<PaymentResult> {
  const session = await auth();

  if (!session) {
    return {
      ok: false,
      errors: { '401': ['not authorized'] },
    };
  }

  const user = session.user!;

  // Only managers and admins can record payments
  if (user.role === Roles.User) {
    return {
      ok: false,
      errors: { '403': ['insufficient permissions'] },
    };
  }

  const parsed = paymentSchema.safeParse(formData);

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();

    return {
      ok: false,
      errors: fieldErrors,
      formError: formErrors.join(' '),
      values: formData,
    };
  }

  const { userId, amountCents, currency, note } = parsed.data;

  try {
    // Create the payment and allocations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Record the payment
      const payment = await tx.payment.create({
        data: {
          userId,
          amountCents,
          currency,
          note,
          recordedById: +user.id,
        },
      });

      // First, apply any existing credits to unpaid logs
      const { allocations } = await applyExistingCredits(userId);
      // console.warn(allocations);

      // Create allocations if any
      if (allocations.length > 0) {
        await tx.paymentAllocation.createMany({ data: allocations });
      }

      const payments = await tx.payment.findMany({
        where: { isFullyAllocated: false },
        include: {
          allocations: {
            where: {
              paymentId: { in: allocations.map((a) => a.paymentId) }, // false,
            },
          },
        },
      });

      for (const p of payments) {
        const totalAllocated = p.allocations.reduce((sum, a) => sum + a.amountCents, 0);
        // console.warn(p.id, totalAllocated);

        if (totalAllocated >= p.amountCents) {
          await tx.payment.update({
            where: { id: p.id },
            data: { isFullyAllocated: true },
          });
        }
      }

      const uniqueLogIds = allocations.map((a) => a.beerLogId);

      for (const logId of uniqueLogIds) {
        const log = await tx.beerLog.findUnique({
          where: { id: logId },
          include: {
            paymentAllocations: true,
          },
        });

        if (log) {
          const totalAllocated = log.paymentAllocations.reduce((sum, a) => sum + a.amountCents, 0);

          if (totalAllocated >= log.costCentsAtTime) {
            await tx.beerLog.update({
              where: { id: log.id },
              data: { isPaidFor: true },
            });
          }
        }
      }

      return payment;
    });

    return {
      ok: true,
      paymentId: result.id,
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    return {
      ok: false,
      formError: 'Failed to record payment',
      values: formData,
    };
  }
}

/**
 * Get balance information for a user
 */
export async function getUserBalance(userId: number) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const user = session.user!;

  // Users can only see their own balance, managers/admins can see any
  if (user.role === Roles.User && +user.id !== userId) {
    return null;
  }

  return await getUserBalanceDetails(userId);
}

/**
 * Get payment history for a user
 */
export async function getUserPaymentHistory(userId: number) {
  const session = await auth();

  if (!session) {
    return null;
  }

  const user = session.user!;

  // Users can only see their own history, managers/admins can see any
  if (user.role === Roles.User && +user.id !== userId) {
    return null;
  }

  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      allocations: {
        include: {
          beerLog: true,
        },
      },
      recordedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return payments;
}
