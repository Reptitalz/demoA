
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { FaGoogle } from 'react-icons/fa';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import LoadingStatus from '@/components/shared/LoadingStatus';

const APP_NAME = "Hey Manito!";

const LoginPageContent = () => {
  const router = useRouter();
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { toast } = useToast();

  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  useEffect(() => {
    // Redirect if the user is already authenticated and the initial load is complete
    if (!state.loadingStatus.active && state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.userProfile.isAuthenticated, state.loadingStatus.active, router]);

  const handleGoogleLogin = async () => {
    dispatch({ type: 'SET_LOADING_STATUS', payload: { active: true, message: 'Abriendo autenticación con Google...', progress: 20 } });
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user && user.email) {
        dispatch({ type: 'SET_LOADING_STATUS', payload: { active: true, message: 'Verificando perfil...', progress: 60 } });
        
        const profile = await fetchProfileCallback(user.email);
        
        if (profile) {
          // Profile exists, dispatch sync and redirect via useEffect
          dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: profile });
          toast({ title: '¡Bienvenido/a de nuevo!', description: 'Has iniciado sesión correctamente.' });
          router.push('/dashboard'); // Explicit redirect
        } else {
          // User authenticated with Google but has no profile in our DB
          await auth.signOut(); // Sign out to prevent inconsistent state
          toast({
            title: 'Cuenta no encontrada',
            description: 'No encontramos un perfil asociado a esta cuenta de Google. Por favor, crea un asistente para registrarte.',
            variant: 'destructive',
          });
        }
      } else {
         throw new Error('No se pudo obtener la información del usuario de Google.');
      }
    } catch (error: any) {
      console.error("Login Error:", error);
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
        dispatch({ type: 'SET_LOADING_STATUS', payload: { active: false } });
    }
  };

  const handleOpenRegisterDialog = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setIsRegisterDialogOpen(true);
  };
  
  if (state.loadingStatus.active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingStatus status={state.loadingStatus} />
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
            disabled={state.loadingStatus.active}
            className="w-full bg-brand-gradient text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <FaGoogle className="h-5 w-5" />
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
