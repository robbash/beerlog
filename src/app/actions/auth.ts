'use server';

import { signOut } from '@/lib/server/auth';

export async function logout() {
  await signOut();
}
