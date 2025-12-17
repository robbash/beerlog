import { prisma } from '@/lib/server/prisma';

export async function resetDatabase() {
  prisma.paymentAllocation.deleteMany();
  prisma.payment.deleteMany({});
  prisma.beerLog.deleteMany();
  prisma.user.deleteMany();
  prisma.auditLog.deleteMany();
}
