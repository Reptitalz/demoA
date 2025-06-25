
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { AuthProviderType } from "@/types";

interface Step3AuthenticationProps {
  onSuccess: () => void;
}

const Step3Authentication = ({ onSuccess }: Step3AuthenticationProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { authMethod } = state.wizard;
  const { isAuthenticated, authProvider: userProfileAuthProvider } = state.userProfile;
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const hasCalledOnSuccess = useRef(false);

  // Effect to sync wizard state AND advance if user is ALREADY authenticated when the component loads
  useEffect(() => {
    if (isAuthenticated && userProfileAuthProvider && !authMethod) {
      dispatch({ type: 'SET_AUTH_METHOD', payload: userProfileAuthProvider });
      if (!hasCalledOnSuccess.current) {
          onSuccess();
          hasCalledOnSuccess.current = true;
      }
    }
  }, [isAuthenticated, userProfileAuthProvider, authMethod, dispatch, onSuccess]);

  const handleGoogleSignIn = async () => {
    if (!googleProvider) {
      toast({
        title: "Configuración Incompleta",
        description: "La autenticación de Firebase no está configurada. Por favor, revisa las variables de entorno.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingAuth(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        dispatch({ type: 'SET_AUTH_METHOD', payload: 'google' });
        toast({
          title: 'Inicio de Sesión Exitoso',
          description: `Has iniciado sesión como ${result.user.email}.`,
        });
        if (!hasCalledOnSuccess.current) {
          onSuccess();
          hasCalledOnSuccess.current = true;
        }
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Error durante el inicio de sesión con Google:", error);
        toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
      }
    } finally {
      setIsProcessingAuth(false);
    }
  };
  
  const handleAuthSelect = (methodId: AuthProviderType) => {
    if (authMethod === methodId) return; // Don't re-trigger if already selected

    if (methodId === "google") {
      handleGoogleSignIn();
    }
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Autenticación de Cuenta</CardTitle>
        <CardDescription>Inicia sesión para guardar la configuración de tu asistente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessingAuth ? (
          <div className="flex items-center justify-center p-4 min-h-[76px]">
            <FaSpinner className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-2">Procesando...</p>
          </div>
        ) : (
          <>
            {AUTH_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = authMethod === method.id;
              return (
                <Button
                  key={method.id}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
                  onClick={() => handleAuthSelect(method.id)}
                  aria-pressed={isSelected}
                  disabled={isProcessingAuth}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isSelected ? 'text-primary-foreground': 'text-primary'}`} />
                  {method.name}
                  {isSelected && <FaCheckCircle className="ml-auto h-5 w-5 text-primary-foreground" />}
                </Button>
              );
            })}
             {authMethod === "google" && isAuthenticated && state.userProfile.email && (
              <p className="text-sm text-center text-green-500 flex items-center justify-center gap-1 pt-2">
                <FaCheckCircle size={16} /> Autenticado como {state.userProfile.email}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;
