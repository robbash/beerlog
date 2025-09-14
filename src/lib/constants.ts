import { Role } from '@prisma/client';

export const Globals = {
  title: 'Beer Log',
  description: 'Track your spending...',
};

export const Roles = {
  Admin: 'ADMIN' as Role,
  Manager: 'MANAGER' as Role,
  User: 'USER' as Role,
};

export const Constants = {
  CURRENCY: 'EUR',
};
