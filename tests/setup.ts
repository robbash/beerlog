import { prismaMock } from './__mocks__/prisma';

vi.mock('@/lib/prisma', () => {
  return { prisma: prismaMock };
});
