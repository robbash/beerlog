import { format, subDays } from 'date-fns';
import { createBeerLog, createPayment, createUser } from '../../utils/factories';
import { allocatePayments, getUserBalance, recordPayment } from '@/app/actions/payment';
import * as auth from '@/lib/auth';
import { dateFormat, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { resetDatabase } from '../../utils/helpers';
import { getUserBalanceDetails } from '@/lib/payments';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Payment action', () => {
  afterEach(async () => {
    await resetDatabase();
  });

  describe('recordPayment', () => {
    it('rejects unauthorised', async () => {
      const result = await recordPayment({ userId: 1, amountCents: 300, currency: 'EUR' });

      expect(result).toEqual({ ok: false, errors: { '401': ['not authorized'] } });
    });

    it('rejects insufficient permissions', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.User } } as any);

      const result = await recordPayment({ userId: 1, amountCents: 300, currency: 'EUR' });

      expect(result).toEqual({ ok: false, errors: { '403': ['insufficient permissions'] } });
    });

    it('should record payment successfully', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.Admin, id: 1 } } as any);

      const user = await createUser();

      const result = await recordPayment({ userId: user.id, amountCents: 500, currency: 'EUR' });

      expect(result.paymentId).toEqual(1);

      const payment = await prisma.payment.findFirst({ where: { id: result.paymentId } });

      expect(payment).toEqual({
        amountCents: 500,
        createdAt: expect.anything(),
        currency: 'EUR',
        id: 1,
        isFullyAllocated: false,
        note: null,
        recordedById: 1,
        userId: 1,
      });
    });
  });

  describe('allocatePayments', () => {
    it('rejects unauthorised', async () => {
      const result = await recordPayment({ userId: 1, amountCents: 300, currency: 'EUR' });

      expect(result).toEqual({ ok: false, errors: { '401': ['not authorized'] } });
    });

    it('rejects insufficient permissions', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.User } } as any);

      const result = await recordPayment({ userId: 1, amountCents: 300, currency: 'EUR' });

      expect(result).toEqual({ ok: false, errors: { '403': ['insufficient permissions'] } });
    });

    it('should use previous credits first', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.Admin, id: 1 } } as any);

      const user = await createUser();
      const manager = await createUser({ role: Roles.Manager });

      await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: subDays(new Date(), 1),
      });
      await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: new Date(),
      });

      await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: format(subDays(new Date(), 3), dateFormat),
      });
      await createBeerLog({
        userId: user.id,
        quantity: 2,
        date: format(subDays(new Date(), 2), dateFormat),
      });
      await createBeerLog({
        userId: user.id,
        quantity: 4,
        date: format(subDays(new Date(), 1), dateFormat),
      });

      const result = await allocatePayments(user.id);

      expect(result.ok).toBe(true);
      expect(result.allocated).toEqual(900);

      const payments = await prisma.payment.findMany({ include: { allocations: true } });

      expect(payments[0].id).toEqual(2);
      expect(payments[0].isFullyAllocated).toEqual(true);
      expect(payments[1].isFullyAllocated).toEqual(false);

      const logs = await prisma.beerLog.findMany();

      expect(logs).toHaveLength(3);
      expect(logs[0].isPaidFor).toEqual(true);
      expect(logs[1].isPaidFor).toEqual(true);
      expect(logs[2].isPaidFor).toEqual(true);

      const balance = await getUserBalanceDetails(user.id);

      expect(balance).toEqual({
        creditCents: 100,
        netBalanceCents: 100,
        owedCents: 0,
      });
    });

    it('should use up all credits', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.Admin, id: 1 } } as any);

      const user = await createUser();
      const manager = await createUser({ role: Roles.Manager });

      await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: subDays(new Date(), 1),
      });
      await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: new Date(),
      });

      await createBeerLog({
        userId: user.id,
        quantity: 5,
        date: format(subDays(new Date(), 4), dateFormat),
      });
      await createBeerLog({
        userId: user.id,
        quantity: 3,
        date: format(subDays(new Date(), 3), dateFormat),
      });
      await createBeerLog({
        userId: user.id,
        quantity: 2,
        date: format(subDays(new Date(), 2), dateFormat),
      });
      await createBeerLog({
        userId: user.id,
        quantity: 4,
        date: format(subDays(new Date(), 1), dateFormat),
      });

      const result = await allocatePayments(user.id);

      expect(result.ok).toBe(true);
      expect(result.allocated).toEqual(1000);

      const payments = await prisma.payment.findMany({ include: { allocations: true } });

      expect(payments[0].isFullyAllocated).toEqual(true);
      expect(payments[1].isFullyAllocated).toEqual(true);

      const logs = await prisma.beerLog.findMany();

      expect(logs).toHaveLength(4);
      expect(logs[0].isPaidFor).toEqual(true);
      expect(logs[1].isPaidFor).toEqual(true);
      expect(logs[2].isPaidFor).toEqual(true);
      expect(logs[3].isPaidFor).toEqual(false);

      const balance = await getUserBalanceDetails(user.id);

      expect(balance).toEqual({
        creditCents: 0,
        netBalanceCents: -400,
        owedCents: 400,
      });
    });
  });
});
