
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { UserPlus, Mail, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import LoadingStatus from '@/components/shared/LoadingStatus';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const APP_NAME = "Hey Manito!";

const LoginPageContent = () => {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    if (status === 'authenticated' && state.userProfile.isAuthenticated) {
      router.replace('/dashboard/assistants');
    }
  }, [status, state.userProfile.isAuthenticated, router]);
  
  useEffect(() => {
    // This effect handles the case where a user signs in with Google but doesn't have a profile yet.
    // The AppProvider will fetch the profile, and if it's not found (but the session is authenticated),
    // we guide the user to register by creating their first assistant.
    if (status === 'authenticated' && !state.userProfile.isAuthenticated && !state.loadingStatus.active) {
       toast({
          title: "Cuenta no encontrada",
          description: "Parece que eres nuevo. Por favor, crea tu primer asistente para registrarte.",
          variant: "default",
          duration: 6000
      });
      handleOpenRegisterDialog();
    }
  }, [status, state.userProfile.isAuthenticated, state.loadingStatus.active, toast]);

  const handleLogin = async (provider: 'google' | 'credentials') => {
    setIsLoggingIn(true);
    let result;
    try {
        if (provider === 'google') {
            result = await signIn('google', { redirect: false, callbackUrl: '/dashboard' });
        } else {
            result = await signIn('credentials', {
                redirect: false,
                email,
                password,
                callbackUrl: '/dashboard'
            });
        }
        
        if (result?.error) {
            // Check for a specific error message from our authorize function
            if (result.error.includes("Credenciales inválidas")) {
                 throw new Error("Credenciales inválidas. Por favor, inténtalo de nuevo.");
            }
            throw new Error(result.error);
        }

        // If sign-in is successful but there's no error, Next-Auth will handle the redirect.
        // The useEffect hooks will manage the session state and redirect to the dashboard or open the register dialog.
        
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: "Error de inicio de sesión",
        description: error.message || 'No se pudo iniciar sesión. Por favor, intenta de nuevo.',
        variant: "destructive",
      });
    } finally {
        setIsLoggingIn(false);
    }
  };


  const handleOpenRegisterDialog = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setIsRegisterDialogOpen(true);
  };
  
  if (status === 'loading' || (state.loadingStatus.active && !isRegisterDialogOpen)) {
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

        <form onSubmit={(e) => { e.preventDefault(); handleLogin('credentials'); }} className="space-y-4">
            <div>
              <Label htmlFor="email" className="sr-only">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
             <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full font-semibold py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
            >
              {isLoggingIn ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Iniciar Sesión'}
            </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">O</span>
          </div>
        </div>
        
        <div className="space-y-4">
           <Button
            onClick={() => handleLogin('google')}
            disabled={isLoggingIn}
            className="w-full bg-brand-gradient text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isLoggingIn ? <FaSpinner className="animate-spin h-5 w-5" /> : <FaGoogle className="h-5 w-5" />}
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
