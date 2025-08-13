
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseApp } from '@/lib/firebase'; // Ensure you have a firebase client initialization

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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Se requieren correo electrónico y contraseña.");
        }
        
        const auth = getAuth(firebaseApp);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          const firebaseUser = userCredential.user;

          if (firebaseUser) {
            // Find user in our DB to return to next-auth
            const { db } = await connectToDatabase();
            const userInDb = await db.collection('users').findOne({ email: firebaseUser.email });
            
            if (userInDb) {
              return {
                id: userInDb._id.toString(),
                name: userInDb.name,
                email: userInDb.email,
                image: userInDb.image,
              };
            }
          }
           return null; // Should not happen if registration flow is correct
        } catch (error: any) {
          // Handle Firebase auth errors (e.g., wrong password, user not found)
          console.error("Firebase auth error:", error.code);
          throw new Error("Credenciales inválidas. Por favor, inténtalo de nuevo.");
        }
      }
    })
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
     async signIn({ user, account, profile }) {
      console.log(`User signing in: ${user.email}. Allowing sign-in. Profile will be checked/created client-side.`);
      return true;
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
