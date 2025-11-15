import { prisma } from '@/lib/prisma';

describe('Prisma', () => {
  describe('mock setup', () => {
    it('should work as if using the real instance', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'hans@example.com',
          firstName: 'Hans',
          lastName: 'Smith',
          passwordHash: 'bla',
        },
      });

      expect(user).not.toBeUndefined();
    });
  });
});
