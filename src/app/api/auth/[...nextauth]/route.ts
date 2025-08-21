
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToDatabase } from "@/lib/mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseApp } from '@/lib/firebase';
import type { UserProfile, CollaboratorProfile } from '@/types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth credentials in .env.local");
}
if (!NEXTAUTH_SECRET) {
    // This is critical for production environments
    throw new Error("Missing NEXTAUTH_SECRET in .env.local");
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
        
        const auth = getAuth(firebaseApp);
        const { email, password, userType } = credentials;

        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          if (firebaseUser) {
            const { db } = await connectToDatabase();
            
            if (userType === 'collaborator') {
              // --- Collaborator Login Logic ---
              const collaborator = await db.collection<CollaboratorProfile>('collaboratorProfiles').findOne({ email: firebaseUser.email });
              if (collaborator) {
                return {
                  id: collaborator.firebaseUid,
                  name: collaborator.firstName,
                  email: collaborator.email,
                  image: null, // Collaborators don't have images for now
                };
              } else {
                throw new Error("Colaborador no encontrado en nuestra base de datos.");
              }
            } else {
              // --- Regular User Login Logic ---
              const userInDb = await db.collection<UserProfile>('userProfiles').findOne({ email: firebaseUser.email });
              if (userInDb) {
                return {
                  id: userInDb.firebaseUid,
                  name: userInDb.firstName,
                  email: userInDb.email,
                  image: userInDb.assistants?.[0]?.imageUrl,
                };
              } else {
                 throw new Error("Usuario no encontrado en nuestra base de datos.");
              }
            }
          }
           throw new Error("No se pudo autenticar con Firebase.");
        } catch (error: any) {
          console.error("Firebase auth error:", error.code, error.message);
          // Always throw an error to be handled by next-auth client
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
     async signIn({ user }) {
      console.log(`User signing in: ${user.email}. Allowing sign-in.`);
      return true;
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
