
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaSpinner, FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import LoadingStatus from '@/components/shared/LoadingStatus';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';
import RegisterCollaboratorDialog from '@/components/auth/RegisterCollaboratorDialog';
import { cn } from '@/lib/utils';

const CollaboratorLoginPage = () => {
  const router = useRouter();
  const { state } = useApp();
  const { toast } = useToast();
  const { status } = useSession();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    // If NextAuth session is good AND we have a user profile loaded, redirect.
    if (status === 'authenticated' && state.userProfile.isAuthenticated) {
      router.replace('/colaboradores/dashboard');
    }
  }, [status, state.userProfile.isAuthenticated, router]);
  
  const handleLogin = async (provider: 'google' | 'credentials') => {
    setIsLoggingIn(true);
    try {
        const result = await signIn(provider, {
            redirect: false,
            ...(provider === 'credentials' && { email, password }),
        });
        
        if (result?.error) {
            throw new Error(result.error);
        }
        toast({ title: "Iniciando sesión...", description: "Verificando tus datos de colaborador."});

    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = 'No se pudo iniciar sesión. Por favor, intenta de nuevo.';
      if (error.message.includes('CredentialsSignin')) {
          errorMessage = "Correo electrónico o contraseña incorrectos.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      toast({
        title: "Error de inicio de sesión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
        setIsLoggingIn(false);
    }
  };
  
  // Show loading indicator while session is being determined or profile is being fetched.
  if (status === 'loading' || state.loadingStatus.active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingStatus status={state.loadingStatus} />
      </div>
    );
  }

  // Once loading is done, and user is not authenticated, show login form.
  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-md bg-card shadow-xl rounded-2xl p-6 sm:p-8 animate-fadeIn animate-float">
          <div className="text-center mb-6 flex flex-col items-center">
            <AppIcon className="h-12 w-12 mb-2" />
            <h1 className="text-3xl font-extrabold text-brand-gradient">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground mt-2">Acceso para Colaboradores</p>
          </div>

          <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleLogin('credentials'); }} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                   <div className="relative">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                     <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-muted-foreground hover:text-primary"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full font-semibold py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoggingIn ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Iniciar Sesión'}
                  </Button>
              </form>
              
             <Button
              onClick={() => handleLogin('google')}
              disabled={isLoggingIn}
              variant="outline"
              className="w-full font-semibold py-3 rounded-lg hover:bg-muted transition-all duration-300 flex justify-center items-center gap-2"
            >
              <FcGoogle className="h-5 w-5" />
              Iniciar Sesión con Google
            </Button>
          </div>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">¿Eres nuevo aquí?</span>
            </div>
          </div>

          <Button
              onClick={() => setIsRegisterDialogOpen(true)}
              variant="outline"
              className="w-full font-semibold py-3 rounded-lg transition-all duration-300 flex justify-center items-center gap-2"
              >
              <UserPlus className="h-5 w-5" />
              Registrarse como Colaborador
          </Button>

        </div>
      </div>
      <RegisterCollaboratorDialog isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
    </>
  );
};

export default CollaboratorLoginPage;
