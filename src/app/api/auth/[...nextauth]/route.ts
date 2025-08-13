
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { UserProfile } from '@/types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials in .env.local");
}
if (!NEXTAUTH_SECRET) {
    console.warn("⚠️ WARNING: NEXTAUTH_SECRET is not set. It will be auto-generated for development, but you MUST set it for production.");
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(
    connectToDatabase().then(conn => conn.client)
  ) as Adapter,
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!; // Use token.sub as the user's ID
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
     async signIn({ user, account, profile }) {
      // This function runs on sign-in.
      // We will check for the profile existence on the client side in AppProvider.
      // This callback should just allow the sign-in to proceed.
      console.log(`User signing in: ${user.email}. Allowing sign-in. Profile will be checked/created client-side.`);
      return true; // Always allow sign-in
    },
  },
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
