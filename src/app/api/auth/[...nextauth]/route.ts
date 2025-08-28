// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { UserProfile, CollaboratorProfile, AssistantConfig } from '@/types';
import bcrypt from 'bcryptjs';
import { DEFAULT_ASSISTANT_IMAGE_URL } from "@/config/appConfig";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
let NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;


if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials in .env.local");
}

if (!NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("CRITICAL: NEXTAUTH_SECRET is not set in environment variables for production.");
    }
    // Use a default, static secret for development and issue a warning.
    NEXTAUTH_SECRET = "super-secret-development-key-for-heymanito";
    console.warn("***************************************************************************");
    console.warn("WARNING: NEXTAUTH_SECRET environment variable is not set.");
    console.warn("Using a default, insecure key for development purposes.");
    console.warn("You MUST set a secure secret in your .env.local file for production.");
    console.warn("Generate one with: `openssl rand -base64 32`");
    console.warn("***************************************************************************");
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
        password: { label: "Password", type: "password" },
        // Add a hidden field to distinguish user types
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.userType) {
          throw new Error("Se requieren correo electrónico, contraseña y tipo de usuario.");
        }
        
        const { email, password, userType } = credentials;
        const { db } = await connectToDatabase();

        try {
          if (userType === 'collaborator') {
            const collaborator = await db.collection<CollaboratorProfile>('collaboratorProfiles').findOne({ email });
            if (!collaborator || !collaborator.password) {
              throw new Error("Colaborador no encontrado o no tiene contraseña.");
            }
            const passwordsMatch = await bcrypt.compare(password, collaborator.password);
            if (!passwordsMatch) {
              throw new Error("Credenciales inválidas.");
            }
            return {
              id: collaborator._id.toString(),
              name: collaborator.firstName,
              email: collaborator.email,
              image: null,
            };
          } else {
             // --- Regular User Login Logic ---
             const userInDb = await db.collection<UserProfile>('userProfiles').findOne({ email });
             if (!userInDb || !userInDb.password) {
                 throw new Error("Usuario no encontrado o no tiene contraseña.");
             }
             const passwordsMatch = await bcrypt.compare(password, userInDb.password);
             if (!passwordsMatch) {
                throw new Error("Credenciales inválidas.");
             }
             return {
                id: userInDb._id.toString(),
                name: userInDb.firstName,
                email: userInDb.email,
                image: userInDb.assistants?.[0]?.imageUrl,
              };
          }
        } catch (error: any) {
          console.error("Authentication error:", error.message);
          throw new Error("Credenciales inválidas. Por favor, inténtalo de nuevo.");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // The user object is only passed on the first sign-in
      if (user) {
        token.sub = user.id; // Persist the user's ID to the token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!; // Add the user ID to the session object
      }
      return session;
    },
     async signIn({ user, account, profile, email, credentials }) {
      // This callback is now simplified. Its main purpose is to allow the sign-in.
      // The logic for creating a new user profile is handled on the client-side
      // after the user is successfully authenticated and redirected.
      return true; // Allow sign-in for all providers
    },
  },
  secret: NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on error, error message will be in URL query
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
