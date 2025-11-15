import {
  getUserOwedAmount,
  getUserCreditBalance,
  getUserNetBalance,
  getUserBalanceDetails,
  applyExistingCredits,
  isBeerLogFullyPaid,
  getLogPaymentStatus,
} from '@/lib/payments';
import {
  createUser,
  createBeerLog,
  createPayment,
  createPaymentAllocation,
} from '../utils/factories';
import { subDays } from 'date-fns';

describe('Payments', () => {
  describe('getUserOwedAmount', () => {
    it('should return 0 when user has no beer logs', async () => {
      const user = await createUser();

      const owed = await getUserOwedAmount(user.id);

      expect(owed).toBe(0);
    });

    it('should return total cost of unpaid beer logs', async () => {
      const user = await createUser();
      await createBeerLog({ userId: user.id, quantity: 3 }); // €3.00
      await createBeerLog({ userId: user.id, quantity: 5 }); // €5.00

      const owed = await getUserOwedAmount(user.id);
      expect(owed).toBe(800); // €8.00
    });

    it('should exclude fully paid logs', async () => {
      const user = await createUser();
      await createBeerLog({ userId: user.id, quantity: 3, isPaidFor: true });
      await createBeerLog({ userId: user.id, quantity: 5, isPaidFor: false });

      const owed = await getUserOwedAmount(user.id);
      expect(owed).toBe(500);
    });

    it('should account for partial payments', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 10 }); // €10.00
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 600,
      }); // €6.00
      await createPaymentAllocation({ paymentId: payment.id, beerLogId: log.id, amountCents: 600 });

      const owed = await getUserOwedAmount(user.id);
      expect(owed).toBe(400); // €4.00 remaining
    });

    it('should handle multiple partially paid logs', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log1 = await createBeerLog({ userId: user.id, quantity: 10 });
      const log2 = await createBeerLog({ userId: user.id, quantity: 5 });

      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 700,
      });
      await createPaymentAllocation({
        paymentId: payment.id,
        beerLogId: log1.id,
        amountCents: 500,
      });
      await createPaymentAllocation({
        paymentId: payment.id,
        beerLogId: log2.id,
        amountCents: 200,
      });

      const owed = await getUserOwedAmount(user.id);
      expect(owed).toBe(800); // (1000 - 500) + (500 - 200) = 800
    });
  });

  describe('getUserCreditBalance', () => {
    it('should return 0 when user has no payments', async () => {
      const user = await createUser();

      const credit = await getUserCreditBalance(user.id);

      expect(credit).toBe(0);
    });

    it('should return full payment amount when unallocated', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      await createPayment({ userId: user.id, recordedById: manager.id, amountCents: 1000 });

      const credit = await getUserCreditBalance(user.id);
      expect(credit).toBe(1000);
    });

    it('should return remaining credit after partial allocation', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 4 });
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 1000,
      });
      await createPaymentAllocation({ paymentId: payment.id, beerLogId: log.id, amountCents: 400 });

      const credit = await getUserCreditBalance(user.id);
      expect(credit).toBe(600);
    });

    it('should return 0 when payment is fully allocated', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 10 });
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 1000,
      });
      await createPaymentAllocation({
        paymentId: payment.id,
        beerLogId: log.id,
        amountCents: 1000,
      });

      const credit = await getUserCreditBalance(user.id);
      expect(credit).toBe(0);
    });

    it('should sum remaining credit from multiple payments', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment1 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 1000,
      });
      const payment2 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });

      const log = await createBeerLog({ userId: user.id, quantity: 3 });
      await createPaymentAllocation({
        paymentId: payment1.id,
        beerLogId: log.id,
        amountCents: 300,
      });

      const credit = await getUserCreditBalance(user.id);
      expect(credit).toBe(1200); // (1000 - 300) + 500
    });
  });

  describe('getUserNetBalance', () => {
    it('should return positive balance when credits exceed debts', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      await createPayment({ userId: user.id, recordedById: manager.id, amountCents: 1000 });
      await createBeerLog({ userId: user.id, quantity: 3 });

      const balance = await getUserNetBalance(user.id);
      expect(balance).toBe(700); // Credit of €7.00
    });

    it('should return negative balance when debts exceed credits', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      await createPayment({ userId: user.id, recordedById: manager.id, amountCents: 300 });
      await createBeerLog({ userId: user.id, quantity: 10 });

      const balance = await getUserNetBalance(user.id);
      expect(balance).toBe(-700); // Debt of €7.00
    });

    it('should return 0 when credits equal debts', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 10 });
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 1000,
      });
      await createPaymentAllocation({
        paymentId: payment.id,
        beerLogId: log.id,
        amountCents: 1000,
      });

      const balance = await getUserNetBalance(user.id);
      expect(balance).toBe(0);
    });
  });

  describe('getUserBalanceDetails', () => {
    it('should return detailed balance breakdown', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      await createPayment({ userId: user.id, recordedById: manager.id, amountCents: 1500 });
      await createBeerLog({ userId: user.id, quantity: 8 });

      const details = await getUserBalanceDetails(user.id);

      expect(details).toEqual({
        creditCents: 1500,
        owedCents: 800,
        netBalanceCents: 700,
      });
    });
  });

  describe('applyExistingCredits', () => {
    it('should return empty allocations when no credits exist', async () => {
      const user = await createUser();
      await createBeerLog({ userId: user.id, quantity: 5 });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations).toHaveLength(0);
      expect(result.creditUsed).toBe(0);
    });

    it('should apply existing credit to unpaid log', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });
      const log = await createBeerLog({ userId: user.id, quantity: 3 });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].beerLogId).toBe(log.id);
      expect(result.allocations[0].amountCents).toBe(300);
      expect(result.allocations[0].paymentId).toBe(payment.id);
      expect(result.creditUsed).toBe(300);
    });

    it('should use oldest credits first', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const oldPayment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: subDays(new Date(), 1),
      });

      const newPayment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });

      await createBeerLog({ userId: user.id, quantity: 3 });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0].paymentId).toBe(oldPayment.id);
    });

    it('should apply credits to oldest logs first', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });

      const oldLog = await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: '2024-01-01',
      });

      const newLog = await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: '2024-02-01',
      });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations).toHaveLength(2);
      expect(result.allocations[0].beerLogId).toBe(oldLog.id);
      expect(result.allocations[1].beerLogId).toBe(newLog.id);
      expect(result.creditUsed).toBe(500);
    });

    it('should handle partially paid logs', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment1 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });
      const payment2 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });

      const log = await createBeerLog({ userId: user.id, quantity: 10 });

      // Partially pay the log
      await createPaymentAllocation({
        paymentId: payment1.id,
        beerLogId: log.id,
        amountCents: 300,
      });

      const result = await applyExistingCredits(user.id);

      // Should use remaining credit from payment1 (200) and part of payment2 (500)
      expect(result.allocations.length).toBeGreaterThan(0);
      expect(result.creditUsed).toBe(700); // To pay off the remaining 1000 - 300 = 700
    });

    it('should not apply credits to fully paid logs', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 1000,
      });
      const log = await createBeerLog({ userId: user.id, quantity: 5, isPaidFor: true });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations).toHaveLength(0);
      expect(result.creditUsed).toBe(0);
    });

    it('should handle multiple credits across multiple logs', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const payment1 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 400,
      });
      const payment2 = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 400,
      });

      const log1 = await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: '2024-01-01',
      });
      const log2 = await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: '2024-01-02',
      });

      const result = await applyExistingCredits(user.id);

      expect(result.allocations.length).toBeGreaterThan(0);
      expect(result.creditUsed).toBe(600); // Both logs fully paid
    });
  });

  describe('isBeerLogFullyPaid', () => {
    it('should return false for unpaid log', async () => {
      const user = await createUser();
      const log = await createBeerLog({ userId: user.id, quantity: 5 });

      const isPaid = await isBeerLogFullyPaid(log.id);
      expect(isPaid).toBe(false);
    });

    it('should return true when allocations equal cost', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 5 });
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
      });
      await createPaymentAllocation({ paymentId: payment.id, beerLogId: log.id, amountCents: 500 });

      const isPaid = await isBeerLogFullyPaid(log.id);
      expect(isPaid).toBe(true);
    });

    it('should return true when allocations exceed cost', async () => {
      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const log = await createBeerLog({ userId: user.id, quantity: 5 });
      const payment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 600,
      });
      await createPaymentAllocation({ paymentId: payment.id, beerLogId: log.id, amountCents: 600 });

      const isPaid = await isBeerLogFullyPaid(log.id);
      expect(isPaid).toBe(true);
    });

    it('should return false for non-existent log', async () => {
      const isPaid = await isBeerLogFullyPaid(999999);
      expect(isPaid).toBe(false);
    });
  });

  describe('getLogPaymentStatus', () => {
    it('should return "paid" when isPaidFor is true', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: true,
        paymentAllocations: [],
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('paid');
    });

    it('should return "unpaid" when no allocations exist', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: false,
        paymentAllocations: [],
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('unpaid');
    });

    it('should return "partial" when allocations are less than cost', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: false,
        paymentAllocations: [{ amountCents: 300 }],
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('partial');
    });

    it('should return "paid" when allocations equal cost', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: false,
        paymentAllocations: [{ amountCents: 300 }, { amountCents: 200 }],
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('paid');
    });

    it('should return "paid" when allocations exceed cost', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: false,
        paymentAllocations: [{ amountCents: 600 }],
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('paid');
    });

    it('should handle missing paymentAllocations property', () => {
      const log = {
        costCentsAtTime: 500,
        isPaidFor: false,
      };

      const status = getLogPaymentStatus(log);
      expect(status).toBe('unpaid');
    });
  });
});
