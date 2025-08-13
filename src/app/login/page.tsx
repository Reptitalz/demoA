
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { FaSpinner, FaGoogle } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const APP_NAME = "Hey Manito!";

const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
  <FaSpinner className="animate-spin" style={{ width: size, height: size }} />
);

const LoginPageContent = () => {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  useEffect(() => {
    // The onAuthStateChanged listener in AppProvider is the source of truth for redirection.
    // If the user is authenticated, it will redirect them to the dashboard.
    // This effect ensures that if the user somehow lands here while authenticated, they are moved.
    if (state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.userProfile.isAuthenticated, router]);
  
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      // The only responsibility here is to initiate the sign-in.
      // The onAuthStateChanged listener in AppProvider will handle the profile fetching,
      // state updates, and redirection. This avoids race conditions.
      await signInWithPopup(auth, provider);
      // No need to do anything else here. AppProvider will take over.
    } catch (error: any) {
      // Handle only errors from the popup itself (e.g., closed by user).
      let errorMessage = 'No se pudo iniciar sesión con Google. Intenta de nuevo.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El proceso de inicio de sesión fue cancelado.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Ya existe una cuenta con este correo electrónico pero con un método de inicio de sesión diferente.';
      }
      
      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
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
  
  // Display a loading spinner if the initial auth state check is still running.
  if (state.isLoading) {
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
