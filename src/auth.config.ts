import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth v5 — Edge-compatible config
 *
 * This file is imported by middleware.ts (runs in Edge Runtime),
 * so it must NOT import any Node-only modules (pg, bcryptjs, etc.).
 * Heavy validation logic stays in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    /** Attach user id & role to the JWT token */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? 'user';
      }
      return token;
    },
    /** Expose token fields on the session object */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
    /** Route protection — runs in middleware */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnExam = nextUrl.pathname.startsWith('/exam');
      const isOnLogin = nextUrl.pathname === '/login';

      // Protected routes: /exam/*
      if (isOnExam) {
        if (isLoggedIn) return true;
        return false; // redirect to login
      }

      // If already logged in and visiting /login, redirect to exams
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/exams', nextUrl));
      }

      return true;
    },
  },
  providers: [], // actual providers are in auth.ts
} satisfies NextAuthConfig;
