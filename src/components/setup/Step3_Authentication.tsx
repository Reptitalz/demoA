
"use client";

import React, { useEffect, useState } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { auth, googleProvider, signInWithRedirect } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { AuthProviderType } from "@/types";

const Step3Authentication = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { authMethod } = state.wizard;
  const { isAuthenticated, email } = state.userProfile;
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Effect to sync wizard state if user is ALREADY authenticated when the component loads
  useEffect(() => {
    if (isAuthenticated && !authMethod) {
      dispatch({ type: 'SET_AUTH_METHOD', payload: 'google' });
    }
  }, [isAuthenticated, authMethod, dispatch]);

  const handleGoogleSignIn = async () => {
    if (!googleProvider) {
      toast({
        title: "Configuración Incompleta",
        description: "La autenticación de Firebase no está configurada.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessingAuth(true);
    try {
      // Redirect the user to the Google sign-in page. AppProvider will handle the result.
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Error durante el inicio de sesión con Google:", error);
      toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
      setIsProcessingAuth(false); // Only set back to false on error.
    }
  };
  
  const handleAuthSelect = (methodId: AuthProviderType) => {
    if (authMethod === methodId) return;

    if (methodId === "google") {
      handleGoogleSignIn();
    }
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Autenticación de Cuenta</CardTitle>
        <CardDescription>Inicia sesión o crea una cuenta para guardar la configuración de tu asistente. Este es el último paso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessingAuth ? (
          <div className="flex items-center justify-center p-4 min-h-[76px]">
            <FaSpinner className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-2">Redirigiendo a Google...</p>
          </div>
        ) : (
          <>
            {AUTH_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = authMethod === method.id && isAuthenticated;
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
             {authMethod === "google" && isAuthenticated && email && (
              <p className="text-sm text-center text-green-500 flex items-center justify-center gap-1 pt-2">
                <FaCheckCircle size={16} /> Autenticado como {email}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;

    