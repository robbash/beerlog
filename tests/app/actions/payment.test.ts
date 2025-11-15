import { format, subDays } from 'date-fns';
import { createBeerLog, createPayment, createUser } from '../../utils/factories';
import { recordPayment } from '@/app/actions/payment';
import * as auth from '@/lib/auth';
import { dateFormat, Roles } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('Payment action', () => {
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

    it('should use previous credits first', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({ user: { role: Roles.Admin, id: 1 } } as any);

      const user = await createUser();
      const manager = await createUser({ role: 'MANAGER' });

      const previousPayment = await createPayment({
        userId: user.id,
        recordedById: manager.id,
        amountCents: 500,
        createdAt: subDays(new Date(), 1),
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

      const result = await recordPayment({ userId: user.id, amountCents: 500, currency: 'EUR' });

      expect(result.paymentId).toEqual(2);

      const payments = await prisma.payment.findMany({ include: { allocations: true } });

      // console.warn(JSON.stringify(payments));

      expect(payments[0].id).toEqual(previousPayment.id);
      expect(payments[0].isFullyAllocated).toEqual(true);
      expect(payments[1].isFullyAllocated).toEqual(false);
    });
  });
});
