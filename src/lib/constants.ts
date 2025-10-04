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

export const dateRegex = /^\d{4}(-\d{2}){2}$/;
export const dateFormat = 'yyyy-MM-dd';
export const humanDateFormat = 'dd.MM.yyyy';

export const logFormToday = 'today';
export const logFormNewForUser = 'new-for-user';
