// import { User } from '@/types/next-auth';
import { auth, User } from './auth';

export async function requireAuth() {
  const s = await auth();

  if (!s?.user) throw new Error('UNAUTHENTICATED');

  return s.user;
}

export function canEdit(user: User, ownerId: number) {
  if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
  return Number(user.id) === Number(ownerId);
}

export function isAdminOrManager(user: User) {
  return user.role === 'ADMIN' || user.role === 'MANAGER';
}
