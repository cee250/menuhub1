import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        slug: { label: "Slug", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const creds = credentials as any;
        const userInput = creds?.slug;
        const passwordInput = creds?.password;
        const intendedRole = creds?.role;

        if (!userInput || !passwordInput) return null;
        const identifier = String(userInput).trim().toLowerCase();

        try {
          if (intendedRole === 'owner') {
            const business = await prisma.business.findFirst({
              where: { OR: [{ email: identifier }, { slug: identifier }] },
            });
            if (business && business.password) {
              const isValid = await bcrypt.compare(String(passwordInput), business.password);
              if (isValid) return { id: business.id, email: business.email, name: business.name, slug: business.slug.toLowerCase(), role: 'owner', businessId: business.id };
            }
          }

          if (intendedRole === 'manager') {
            const manager = await prisma.manager.findUnique({
              where: { slug: identifier },
              include: { business: true }
            });
            if (manager) {
              const isValid = await bcrypt.compare(String(passwordInput), manager.password);
              if (isValid) return { id: manager.id, name: manager.name, slug: manager.slug.toLowerCase(), role: 'manager', businessId: manager.businessId, businessSlug: manager.business.slug.toLowerCase() };
            }
          }
          return null;
        } catch (error) {
          console.error("Auth Error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.slug = (user as any).slug;
        token.name = user.name;
        token.role = (user as any).role;
        token.businessId = (user as any).businessId;
        token.businessSlug = (user as any).businessSlug;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).slug = token.slug;
        (session.user as any).name = token.name;
        (session.user as any).role = token.role;
        (session.user as any).businessId = token.businessId;
        (session.user as any).businessSlug = token.businessSlug;
      }
      return session;
    },
  },
});
