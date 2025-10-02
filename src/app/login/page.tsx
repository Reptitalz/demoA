
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaSpinner, FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import LoadingStatus from '@/components/shared/LoadingStatus';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AppIcon from '@/components/shared/AppIcon';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';

const APP_NAME = "Hey Manito!";

const LoginPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useApp();
  const { toast } = useToast();
  const { status } = useSession();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  
  useEffect(() => {
    if (status === 'authenticated' && state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [status, state.userProfile.isAuthenticated, router]);
  
  useEffect(() => {
      const error = searchParams.get('error');
      if (error) {
          toast({
              title: "Error de inicio de sesión",
              description: error === 'CredentialsSignin' 
                ? "Correo electrónico o contraseña incorrectos."
                : "Ha ocurrido un error. Por favor, intenta de nuevo.",
              variant: "destructive",
          });
          router.replace('/login', {scroll: false});
      }
  }, [searchParams, toast, router]);

  const handleLogin = async (provider: 'google' | 'credentials') => {
    setIsLoggingIn(true);
    
    // Default callback for dashboard login
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    
    let result;
    if (provider === 'credentials') {
        result = await signIn('credentials', {
            redirect: false, // Handle redirect manually
            email,
            password,
            userType: 'user',
        });
    } else {
        // For Google, NextAuth handles the redirect via callbackUrl
        await signIn('google', { callbackUrl });
        return; 
    }
    
    setIsLoggingIn(false);
    
    if (result?.error) {
         toast({
              title: "Error de inicio de sesión",
              description: "Correo electrónico o contraseña incorrectos.",
              variant: "destructive",
          });
    } else if (result?.ok) {
        router.push(callbackUrl); // Manually redirect for credentials
    } else {
        toast({
            title: "Error de inicio de sesión",
            description: "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
            variant: "destructive",
        });
    }
  };
  
  if (status === 'loading' || (status === 'authenticated' && !state.userProfile.isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <LoadingStatus status={state.loadingStatus} />
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/">
            <AppIcon className="h-14 w-14 mb-3" />
          </Link>
          <h1 className="text-3xl font-extrabold text-brand-gradient">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-2">Inicia sesión o crea tu primer asistente inteligente.</p>
        </div>

        <div className="space-y-4 p-6 sm:p-8 rounded-2xl bg-card/60 backdrop-blur-md border border-border/20 shadow-xl">
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

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O si eres nuevo</span>
          </div>
        </div>

        <Button
            onClick={() => setIsRegisterDialogOpen(true)}
            className={cn(
                "w-full font-semibold py-3 rounded-lg transition-all duration-300 flex justify-center items-center gap-2",
                "bg-brand-gradient text-primary-foreground hover:opacity-90",
                "shiny-border"
            )}
            >
            <FaUserPlus className="h-5 w-5" />
            Registrarse
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
            <Button variant="secondary" onClick={() => router.push('/dashboarddemo')} className="w-full mt-4">
              Modo Demo (Dashboard)
            </Button>
        )}
        
      </div>
    </div>
    <RegisterAssistantDialog isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
    </>
  );
};

const LoginPage = () => {
  return (
    <Suspense fallback={
        <PageContainer className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size={36} />
        </PageContainer>
    }>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
