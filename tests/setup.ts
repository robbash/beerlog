import { prismaMock } from './__mocks__/prisma';

vi.mock('@/lib/server/prisma', () => {
  return { prisma: prismaMock };
});
