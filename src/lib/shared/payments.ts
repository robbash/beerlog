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
