import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 🛡️ SECURITY & PRODUCTION CONFIG
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: "/login",
    error: "/login", // Redirect back to login on auth errors
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    Credentials({
      credentials: {
        slug: { label: "Business Slug", type: "text" },
        email: { label: "Email", type: "text" },
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const creds = credentials as any;
        const userInput = creds?.slug || creds?.email || creds?.identifier;
        const passwordInput = creds?.password;

        if (!userInput || !passwordInput) return null;

        const identifier = String(userInput).trim().toLowerCase();

        try {
          const business = await prisma.business.findFirst({
            where: {
              OR: [
                { email: identifier },
                { slug: identifier },
              ],
            },
          });

          if (!business || !business.password) return null;

          const isPasswordValid = await bcrypt.compare(
            String(passwordInput),
            business.password
          );

          if (!isPasswordValid) return null;
          
          return {
            id: business.id,
            email: business.email,
            name: business.name,
            slug: business.slug.toLowerCase(), // Ensure slug is lowercase in session
          };
        } catch (error) {
          console.error("Auth Authorization Error:", error);
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
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).slug = token.slug;
        (session.user as any).name = token.name;
      }
      return session;
    },
  },
});
