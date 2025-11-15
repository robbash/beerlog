import { prisma } from '@/lib/prisma';
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
 * Create a test beer log
 */
export async function createBeerLog(data: {
  userId: number;
  quantity?: number;
  date?: string;
  isPaidFor?: boolean;
}) {
  const { quantity = 1 } = data;

  return await prisma.beerLog.create({
    data: {
      userId: data.userId,
      quantity,
      date: data.date || format(new Date(), 'yyyy-MM-dd'),
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
