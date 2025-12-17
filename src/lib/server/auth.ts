import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
// import { authenticator } from 'otplib';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

declare module 'next-auth' {
  interface Token {
    user: User;
  }
  interface Session {
    user: User;
  }
}

const providers = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: {
        label: 'Email',
        type: 'email',
      },
      password: {
        label: 'Password',
        type: 'password',
      },
      totp: {
        label: 'TOTP',
        type: 'text',
      },
    },
    authorize: async (cred) => {
      const email = String(cred?.email || '')
        .toLowerCase()
        .trim();

      const password = String(cred?.password || '');
      // const totp = String(cred?.totp || '');
      const user = await prisma.user.findUnique({ where: { email, approved: true } });

      if (!user) {
        return null;
      }

      if (!user.approved) {
        throw new Error('NOT_APPROVED');
      }

      const ok = await bcrypt.compare(password, user.passwordHash);

      if (!ok) {
        return null;
      }

      // const requiresMfa = user.role !== 'USER' && user.email !== 'admin@example.com';
      //
      // if (requiresMfa || user.mfaEnabled) {
      //   if (!user.mfaSecret) {
      //     throw new Error('MFA_SETUP_REQUIRED');
      //   }
      //
      //   const valid = authenticator.check(totp, user.mfaSecret);
      //
      //   if (!valid) {
      //     throw new Error('INVALID_TOTP');
      //   }
      // }

      return {
        id: String(user.id),
        firstName: user.firstName,
        lastName: user.firstName,
        email: user.email,
        role: user.role,
        approved: user.approved,
        mfaEnabled: user.mfaEnabled,
      };
    },
  }),
];

const config: NextAuthConfig = {
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user;

      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user = token.user;

      return session;
    },
  },
  providers,
  pages: { signIn: '/login' },
};

export const { auth, signIn, signOut, handlers } = NextAuth(config);
