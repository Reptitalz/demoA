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
        throw new Error("Missing NEXTAUTH_SECRET in .env for production");
    } else {
        // Use a default secret for development, but warn the user.
        NEXTAUTH_SECRET = "super-secret-development-key-heymanito";
        console.warn("**********************************************************************************");
        console.warn("WARNING: NEXTAUTH_SECRET is not set in .env.local. Using a default for development.");
        console.warn("For production, you MUST set a secure secret in your environment variables.");
        console.warn("**********************************************************************************");
    }
}

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  return `/chat/${slug}`;
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
      const { db } = await connectToDatabase();
      const userCollection = db.collection<UserProfile>('userProfiles');
      
      const userEmail = user.email;
      if (!userEmail) {
        console.error("Sign-in error: User email is missing.");
        return false; // Prevent sign-in if no email
      }

      // Check if user already exists
      const existingUser = await userCollection.findOne({ email: userEmail });

      // If user does not exist AND they are signing in with Google, create a new profile
      if (!existingUser && account?.provider === 'google') {
        console.log(`New Google user signing in: ${userEmail}. Creating profile.`);
        
        try {
          // This logic is for users coming from the /begin flow.
          // We can't directly access the assistant type here on the server.
          // So we create a default 'desktop' assistant as a robust fallback.
          const assistantName = "Mi Asistente de Escritorio";
          const assistantType = 'desktop';

          const newAssistant: AssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName,
            type: assistantType,
            prompt: "Eres un asistente amigable y servicial. Tu objetivo es responder preguntas de manera clara y concisa.",
            purposes: [],
            isActive: true, // Desktop assistants start active
            numberReady: true,
            messageCount: 0,
            monthlyMessageLimit: 1000,
            imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
            chatPath: generateChatPath(assistantName),
            isFirstDesktopAssistant: true,
            trialStartDate: new Date().toISOString(),
          };

          const newUserProfile: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
            firebaseUid: user.id,
            authProvider: 'google',
            email: userEmail,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            assistants: [newAssistant],
            databases: [],
            credits: 1, // 1 free credit for the trial
          };

          await userCollection.insertOne(newUserProfile as UserProfile);
          console.log(`Successfully created new user profile for ${userEmail}`);

        } catch (dbError) {
          console.error("Failed to create user profile in database during sign-in:", dbError);
          return false; // Prevent sign-in if DB operation fails
        }
      } else {
        console.log(`Existing user signing in: ${userEmail}.`);
      }
      
      return true; // Allow sign-in
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
