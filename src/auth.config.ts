import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      
      // Allow access to API routes and static files
      if (nextUrl.pathname.startsWith('/api') || 
          nextUrl.pathname.startsWith('/_next') || 
          nextUrl.pathname.startsWith('/static')) {
        return true;
      }

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      // Protect all other routes
      if (!isLoggedIn) {
        return false;
      }
      
      return true;
    },
    // We need to merge this with the session/jwt callbacks in auth.ts
    // but auth.ts handles the main session/jwt logic
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
