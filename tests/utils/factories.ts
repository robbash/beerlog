import { prisma } from '@/lib/server/prisma';
import { hash } from 'bcryptjs';
import { format } from 'date-fns';

/**
 * Create a test user
 */
export async function createUser(data?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'USER' | 'MANAGER' | 'ADMIN';
}) {
  const timestamp = Date.now();
  return await prisma.user.create({
    data: {
      firstName: data?.firstName || 'Test',
      lastName: data?.lastName || 'User',
      email: data?.email || `test${timestamp}@example.com`,
      passwordHash: await hash('password123', 10),
      role: data?.role || 'USER',
      approved: true,
    },
  });
}

/**
 * Monotonic counter so consecutive `createBeerLog` calls that don't pass a
 * `date` get distinct dates — required since BeerLog has a unique
 * constraint on (userId, date). Callers that care about a specific date
 * should still pass it explicitly.
 */
let beerLogDateCounter = 0;

/**
 * Create a test beer log
 */
export async function createBeerLog(data: {
  userId: number;
  quantity?: number;
  date?: string;
  isPaidFor?: boolean;
}) {
  const { quantity = 1 } = data;

  // Generate a unique historical date per call when the test doesn't care
  // about which date it is. Starts at 2000-01-01 and marches forward.
  const autoDate = format(
    new Date(2000, 0, 1 + beerLogDateCounter++),
    'yyyy-MM-dd',
  );

  return await prisma.beerLog.create({
    data: {
      userId: data.userId,
      quantity,
      date: data.date || autoDate,
      costCentsAtTime: quantity * 100,
      isPaidFor: data.isPaidFor || false,
    },
  });
}

/**
 * Create a test payment
 */
export async function createPayment(data: {
  userId: number;
  recordedById: number;
  amountCents?: number;
  currency?: string;
  isFullyAllocated?: boolean;
  note?: string;
  createdAt?: Date;
}) {
  return await prisma.payment.create({
    data: {
      userId: data.userId,
      recordedById: data.recordedById,
      createdAt: data.createdAt || new Date(),
      amountCents: data.amountCents || 1000, // Default €10.00
      currency: data.currency || 'EUR',
      isFullyAllocated: data.isFullyAllocated === true,
      note: data.note,
    },
  });
}

/**
 * Create a payment allocation
 */
export async function createPaymentAllocation(data: {
  paymentId: number;
  beerLogId: number;
  amountCents: number;
}) {
  return await prisma.paymentAllocation.create({
    data: {
      paymentId: data.paymentId,
      beerLogId: data.beerLogId,
      amountCents: data.amountCents,
    },
  });
}
