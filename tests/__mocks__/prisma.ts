import { Prisma } from '@prisma/client';
import createPrismaMock from 'prisma-mock/client';

export const prismaMock = createPrismaMock(Prisma);
