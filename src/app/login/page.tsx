
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { isValidPhoneNumber, type E164Number } from 'react-phone-number-input';
import { LogIn, UserPlus, Phone, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import RegisterAssistantDialog from '@/components/auth/RegisterAssistantDialog';
import { PhoneInput } from '@/components/ui/phone-input';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { getFirebaseApp } from '@/lib/firebase';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const APP_NAME = "Hey Manito";

const LoadingSpinner = ({ size = 24 }: { size?: number }) => (
  <div className="animate-spin rounded-full border-4 border-t-transparent border-primary" style={{ width: size, height: size }} />
);

const LoginPageContent = () => {
  const router = useRouter();
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);

  useEffect(() => {
    if (state.userProfile.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.userProfile.isAuthenticated, router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber) || !password) {
      toast({
        title: "Credenciales incompletas",
        description: "Por favor, ingresa un número de teléfono y contraseña válidos.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      const app = getFirebaseApp();
      if (!app) throw new Error("Firebase no está configurado.");
      const auth = getAuth(app);
      
      // Sign in with the custom token provided by the backend
      await signInWithCustomToken(auth, data.customToken);

      // Now that the user is signed in with Firebase, fetch their profile
      await fetchProfileCallback(phoneNumber);
      
      toast({
        title: "¡Bienvenido/a de nuevo!",
        description: "Has iniciado sesión correctamente.",
      });

      router.replace('/dashboard');

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
      <div id="recaptcha-container"></div>
      <div className="w-full max-w-md bg-card shadow-xl rounded-2xl p-6 sm:p-8 animate-fadeIn animate-float">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-brand-gradient">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-2">Inicia sesión o crea tu primer asistente inteligente.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
              <Phone className="h-4 w-4" /> Número de Teléfono
            </label>
            <PhoneInput
              id="phone-number"
              placeholder="+52 123 456 7890"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value)}
              disabled={isProcessing}
              className="w-full"
              defaultCountry="MX"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground flex items-center gap-1.5 mb-1">
              <Key className="h-4 w-4" /> Contraseña
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Tu contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
              className="w-full"
            />
            <div className="text-right mt-1.5">
                <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                    onClick={() => setIsForgotPasswordDialogOpen(true)}
                >
                    ¿Olvidaste tu contraseña?
                </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-brand-gradient text-primary-foreground font-semibold py-3 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isProcessing ? <LoadingSpinner size={20} /> : <LogIn className="h-5 w-5" />}
            Iniciar Sesión
          </Button>
        </form>

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
    <ForgotPasswordDialog isOpen={isForgotPasswordDialogOpen} onOpenChange={setIsForgotPasswordDialogOpen} />
    </>
  );
};

const LoginPage = () => {
  return (
    <LoginPageContent />
  );
};

export default LoginPage;
