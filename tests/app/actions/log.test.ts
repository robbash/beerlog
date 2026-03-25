import { format } from 'date-fns';
import { createUser } from '../../utils/factories';
import { saveLog } from '@/app/actions/log';
import * as auth from '@/lib/server/auth';
import { dateFormat, Roles } from '@/lib/constants';
import { prisma } from '@/lib/server/prisma';
import { resetDatabase } from '../../utils/helpers';

vi.mock('@/lib/server/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/server/settings', () => ({
  getBeerPriceCents: vi.fn().mockResolvedValue(100), // €1.00 per beer
}));

const today = format(new Date(), dateFormat);

describe('saveLog action', () => {
  afterEach(async () => {
    await resetDatabase();
  });

  describe('auth checks', () => {
    it('rejects unauthenticated requests', async () => {
      const result = await saveLog({ date: today, quantity: 2 });

      expect(result).toEqual({ ok: false, errors: { '401': ['not authorized'] } });
    });
  });

  describe('validation', () => {
    it('rejects quantity of 0', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: '1', role: Roles.User },
      } as any);

      const result = await saveLog({ date: today, quantity: 0 });

      expect(result.ok).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('rejects negative quantity', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: '1', role: Roles.User },
      } as any);

      const result = await saveLog({ date: today, quantity: -1 });

      expect(result.ok).toBe(false);
    });

    it('rejects missing date', async () => {
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: '1', role: Roles.User },
      } as any);

      const result = await saveLog({ date: '', quantity: 2 });

      expect(result.ok).toBe(false);
    });
  });

  describe('creating a log', () => {
    it('creates a beer log for the current user', async () => {
      const user = await createUser();
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: String(user.id), role: Roles.User },
      } as any);

      const result = await saveLog({ date: today, quantity: 3 });

      expect(result.ok).toBe(true);

      const log = await prisma.beerLog.findFirst({ where: { userId: user.id } });
      expect(log).not.toBeNull();
      expect(log?.quantity).toBe(3);
      expect(log?.costCentsAtTime).toBe(300); // 3 * €1.00
    });

    it('ignores userId override for regular users', async () => {
      const user = await createUser();
      const otherUser = await createUser();

      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: String(user.id), role: Roles.User },
      } as any);

      // Regular user tries to log for another user — should be ignored
      const result = await saveLog({ date: today, quantity: 1, userId: otherUser.id });

      expect(result.ok).toBe(true);

      const log = await prisma.beerLog.findFirst({ where: { userId: user.id } });
      expect(log).not.toBeNull();

      const otherLog = await prisma.beerLog.findFirst({ where: { userId: otherUser.id } });
      expect(otherLog).toBeNull();
    });

    it('allows admins to log for other users', async () => {
      const admin = await createUser({ role: Roles.Admin });
      const targetUser = await createUser();

      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: String(admin.id), role: Roles.Admin },
      } as any);

      const result = await saveLog({ date: today, quantity: 2, userId: targetUser.id });

      expect(result.ok).toBe(true);

      const log = await prisma.beerLog.findFirst({ where: { userId: targetUser.id } });
      expect(log).not.toBeNull();
      expect(log?.quantity).toBe(2);
    });
  });

  describe('updating a log', () => {
    it('updates an existing log entry', async () => {
      const user = await createUser();

      // Create a log first
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: String(user.id), role: Roles.User },
      } as any);
      await saveLog({ date: today, quantity: 1 });

      const existing = await prisma.beerLog.findFirst({ where: { userId: user.id } });
      expect(existing).not.toBeNull();

      // Update it
      vi.spyOn(auth, 'auth').mockResolvedValueOnce({
        user: { id: String(user.id), role: Roles.User },
      } as any);
      const result = await saveLog({ id: existing!.id, date: today, quantity: 5 });

      expect(result.ok).toBe(true);

      const updated = await prisma.beerLog.findFirst({ where: { id: existing!.id } });
      expect(updated?.quantity).toBe(5);
      expect(updated?.costCentsAtTime).toBe(500);
    });
  });
});
