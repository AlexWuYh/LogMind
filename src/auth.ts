import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          // console.log(`[Auth] Attempting login for: ${email}`);
          const user = await getUser(email) as any;
          if (!user) {
            // console.log(`[Auth] User not found: ${email}`);
            return null;
          }
          
          if (!user.password) {
             // console.log(`[Auth] User has no password set: ${email}`);
             return null; 
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            // console.log(`[Auth] Password match for: ${email}, Role: ${user.role}`);
            return user;
          }
          
          // console.log(`[Auth] Password mismatch for: ${email}`);
        }

        console.log("Invalid credentials");
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // console.log(`[Auth] JWT callback with user: ${user.id}, Role: ${(user as any).role}`);
        token.sub = user.id;
        token.role = (user as any).role as string;
      }
      return token;
    }
  }
});
