import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    // Google OAuth (if configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    
    // Email magic link (if configured)
    ...(process.env.EMAIL_SERVER
      ? [
          Nodemailer({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || "noreply@guidly.app",
          }),
        ]
      : []),
    
    // Development-only credentials provider for testing
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            name: "Development Login",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "teacher@school.edu" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string | undefined;
              
              if (!email) {
                return null;
              }
              
              // Find or create user for development
              let user = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1)
                .then((rows) => rows[0]);
              
              if (!user) {
                const newUser = {
                  id: nanoid(),
                  email,
                  name: email.split("@")[0],
                  emailVerified: new Date(),
                  image: null,
                  createdAt: new Date(),
                };
                
                await db.insert(users).values(newUser);
                user = newUser;
              }
              
              return {
                id: user.id,
                email: user.email,
                name: user.name,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

