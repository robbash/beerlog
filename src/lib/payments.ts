import { prisma } from './prisma';

/**
 * Calculate the total amount owed by a user (unpaid beer logs)
 */
export async function getUserOwedAmount(userId: number): Promise<number> {
  const unpaidLogs = await prisma.beerLog.findMany({
    where: {
      userId,
      isPaidFor: false,
    },
    include: {
      paymentAllocations: true,
    },
  });

  let totalOwed = 0;

  for (const log of unpaidLogs) {
    const allocatedAmount = log.paymentAllocations.reduce(
      (sum, allocation) => sum + allocation.amountCents,
      0,
    );
    const remainingAmount = log.costCentsAtTime - allocatedAmount;
    totalOwed += remainingAmount;
  }

  return totalOwed;
}

/**
 * Calculate the user's credit balance (unallocated payment amounts)
 */
export async function getUserCreditBalance(userId: number): Promise<number> {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      allocations: true,
    },
  });

  let totalCredit = 0;

  for (const payment of payments) {
    const allocatedAmount = payment.allocations.reduce(
      (sum, allocation) => sum + allocation.amountCents,
      0,
    );
    const remainingCredit = payment.amountCents - allocatedAmount;
    totalCredit += remainingCredit;
  }

  return totalCredit;
}

/**
 * Calculate the net balance for a user (credit - owed)
 * Positive means user has credit, negative means user owes money
 */
export async function getUserNetBalance(userId: number): Promise<number> {
  const [credit, owed] = await Promise.all([
    getUserCreditBalance(userId),
    getUserOwedAmount(userId),
  ]);

  return credit - owed;
}

/**
 * Get user balance details including breakdown
 */
export async function getUserBalanceDetails(userId: number) {
  const [credit, owed] = await Promise.all([
    getUserCreditBalance(userId),
    getUserOwedAmount(userId),
  ]);

  return {
    creditCents: credit,
    owedCents: owed,
    netBalanceCents: credit - owed,
  };
}

interface AllocationResult {
  beerLogId: number;
  amountCents: number;
}

/**
 * Allocate a payment amount to unpaid beer logs
 * Returns the allocations made and remaining credit
 */
export async function allocatePayment(
  userId: number,
  paymentAmountCents: number,
): Promise<{ allocations: AllocationResult[]; remainingCreditCents: number }> {
  // Get unpaid logs ordered by date (oldest first)
  const unpaidLogs = await prisma.beerLog.findMany({
    where: {
      userId,
      isPaidFor: false,
    },
    include: {
      paymentAllocations: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  const allocations: AllocationResult[] = [];
  let remainingAmount = paymentAmountCents;

  for (const log of unpaidLogs) {
    if (remainingAmount <= 0) break;

    // Calculate how much is already allocated to this log
    const allocatedAmount = log.paymentAllocations.reduce(
      (sum, allocation) => sum + allocation.amountCents,
      0,
    );

    const remainingCost = log.costCentsAtTime - allocatedAmount;

    if (remainingCost <= 0) {
      // This log is fully paid, skip it
      continue;
    }

    // Allocate as much as possible to this log
    const allocationAmount = Math.min(remainingAmount, remainingCost);

    allocations.push({
      beerLogId: log.id,
      amountCents: allocationAmount,
    });

    remainingAmount -= allocationAmount;
  }

  return {
    allocations,
    remainingCreditCents: remainingAmount,
  };
}

/**
 * Check if a beer log is fully paid
 */
export async function isBeerLogFullyPaid(beerLogId: number): Promise<boolean> {
  const log = await prisma.beerLog.findUnique({
    where: { id: beerLogId },
    include: {
      paymentAllocations: true,
    },
  });

  if (!log) return false;

  const allocatedAmount = log.paymentAllocations.reduce(
    (sum, allocation) => sum + allocation.amountCents,
    0,
  );

  return allocatedAmount >= log.costCentsAtTime;
}

/**
 * Get payment status for a beer log
 * Returns: 'paid' | 'partial' | 'unpaid'
 */
export function getLogPaymentStatus(log: {
  costCentsAtTime: number;
  isPaidFor: boolean;
  paymentAllocations?: { amountCents: number }[];
}): 'paid' | 'partial' | 'unpaid' {
  if (log.isPaidFor) {
    return 'paid';
  }

  const allocatedAmount = (log.paymentAllocations || []).reduce(
    (sum: number, allocation: { amountCents: number }) => sum + allocation.amountCents,
    0,
  );

  if (allocatedAmount === 0) {
    return 'unpaid';
  }

  if (allocatedAmount < log.costCentsAtTime) {
    return 'partial';
  }

  return 'paid';
}
