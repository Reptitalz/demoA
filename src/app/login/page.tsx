
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { FaSpinner, FaGoogle } from 'react-icons/fa';

const APP_NAME = "Hey Manito";

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
    if (state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.userProfile.isAuthenticated, router]);
  
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    // This is a placeholder for the actual Google Sign-In logic.
    // In a real app, you would use a library like next-auth or Firebase Auth.
    // For this prototype, we'll simulate a successful login.
    
    // Simulate fetching a user profile from Google/your backend
    // In a real scenario, this would involve a redirect or popup and a callback.
    const mockGoogleEmail = 'user@example.com';
    
    try {
      const response = await fetch(`/api/user-profile?email=${encodeURIComponent(mockGoogleEmail)}`);
      
      if (response.status === 404) {
          toast({
            title: "Cuenta no encontrada",
            description: "No encontramos una cuenta con este email. Por favor, crea un asistente primero.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
      }
      
      if (!response.ok) {
        throw new Error('Error al iniciar sesión');
      }

      const data = await response.json();
      
      if (data.userProfile) {
        dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
        sessionStorage.setItem('loggedInUser', data.userProfile.email); // Use email for session
        
        toast({
          title: "¡Bienvenido/a de nuevo!",
          description: "Has iniciado sesión correctamente.",
        });
        
        router.replace('/dashboard');
      } else {
        throw new Error("No se recibieron los datos del perfil.");
      }

    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
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
