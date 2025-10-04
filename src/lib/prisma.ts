import { PrismaClient } from '@prisma/client';
import { auth } from './auth';
import { shallowDiff, type Json } from './utils/object';
import { lcFirst } from './utils/string';

/* eslint-disable @typescript-eslint/no-explicit-any */

const g = global as any;

const auditedModels = ['User', 'BeerLog', 'Payment'];
const auditedOps = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany'];
const skippedProps = ['createdAt', 'updatedAt'];

export const prisma: PrismaClient =
  g.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  }).$extends({
    name: 'audit',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const isAudited = auditedModels.includes(model) && auditedOps.includes(operation);

          let before: any;
          if (isAudited) {
            if (operation.endsWith('Many')) {
              throw new Error('Auditing of `...Many` operation currently not implemented.');
            }

            const where = (args as any).where ?? {};

            before = await (prisma as any)[lcFirst(model)].findFirst({ where });
          }

          const result = await query(args);

          if (isAudited) {
            const session = await auth();

            const diff =
              operation === 'delete' ? before : shallowDiff(before, result as Json, skippedProps);

            if (Object.keys(diff).length > 0) {
              await prisma.auditLog.create({
                data: {
                  actorId: +(session?.user.id ?? -1),
                  action: operation,
                  entity: model,
                  entityId: (args as any).where?.id,
                  diff,
                },
              });
            }
          }

          return result;
        },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
