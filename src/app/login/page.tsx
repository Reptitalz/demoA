
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { FaSpinner, FaGoogle, FaUserSecret } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MOCK_USER_PROFILE } from '@/providers/AppProvider';

const APP_NAME = "Hey Manito";

const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
  <FaSpinner className="animate-spin" style={{ width: size, height: size }} />
);

const LoginPageContent = () => {
  const router = useRouter();
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  useEffect(() => {
    if (state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.userProfile.isAuthenticated, router]);
  
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // The onAuthStateChanged listener in AppProvider will handle fetching the profile
      // and updating the state. We can show a toast here.
      if (user) {
         const response = await fetch(`/api/user-profile?email=${encodeURIComponent(user.email!)}`);
         if (response.status === 404) {
             toast({
                title: "Cuenta no encontrada",
                description: "No tienes un perfil. Por favor, crea un asistente primero.",
                variant: "destructive"
             });
             await auth.signOut(); // Sign out the user from firebase as they don't have a profile
         } else if (response.ok) {
            toast({
              title: "¡Bienvenido/a de nuevo!",
              description: "Has iniciado sesión correctamente.",
            });
            // The AppProvider listener will redirect to /dashboard
         } else {
            throw new Error('No se pudo verificar el perfil de usuario.');
         }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Error de inicio de sesión",
        description: error.code === 'auth/popup-closed-by-user' ? 'El proceso de inicio de sesión fue cancelado.' : 'No se pudo iniciar sesión con Google. Intenta de nuevo.',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRegisterDialog = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setIsRegisterDialogOpen(true);
  };
  
  const handleGuestLogin = () => {
    setIsProcessing(true);
    dispatch({ type: 'LOGIN_GUEST' });
    toast({
        title: "Modo de Prueba Activado",
        description: "Has entrado como invitado. Algunas funciones pueden estar limitadas."
    });
     // The useEffect will catch the state change and redirect
  };


  if (state.isLoading || state.userProfile.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md bg-card shadow-xl rounded-2xl p-6 sm:p-8 animate-fadeIn animate-float">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-brand-gradient">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-2">Inicia sesión o crea tu primer asistente inteligente.</p>
        </div>

        <div className="space-y-4">
           <Button
            onClick={handleGoogleLogin}
            disabled={isProcessing}
            className="w-full bg-brand-gradient text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isProcessing ? <LoadingSpinner size={20} /> : <FaGoogle className="h-5 w-5" />}
            Iniciar Sesión con Google
          </Button>
        </div>


        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">O si eres nuevo</span>
          </div>
        </div>

        <Button
          onClick={handleOpenRegisterDialog}
          variant="outline"
          className="w-full font-semibold py-3 rounded-lg hover:bg-muted transition-all duration-300 flex justify-center items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Crear Asistente
        </Button>
        
        <div className="text-center mt-4">
            <Button variant="link" onClick={handleGuestLogin} disabled={isProcessing} className="text-xs h-auto p-1 text-muted-foreground">
                <FaUserSecret className="mr-1.5" />
                Entrar como invitado para probar
            </Button>
        </div>

      </div>
    </div>
    <RegisterAssistantDialog isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
    </>
  );
};

const LoginPage = () => {
  return (
    <LoginPageContent />
  );
};

export default LoginPage;
