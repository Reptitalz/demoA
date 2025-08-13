// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";

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
  adapter: MongoDBAdapter(connectToDatabase().then(client => client)) as Adapter,
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
      const { db } = await connectToDatabase();
      const userProfileCollection = db.collection('userProfiles');
      
      const existingProfile = await userProfileCollection.findOne({ email: user.email! });

      if (!existingProfile) {
        // This is a new user signing in for the first time.
        // We will create their profile after they complete the registration wizard.
        // For now, we allow the sign-in. The AppProvider will handle redirection.
        console.log(`New user signing in: ${user.email}. Allowing sign-in, profile to be created later.`);
      }
      
      return true; // Allow the sign-in
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
