"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { auth, googleProvider, signInWithRedirect, getRedirectResult } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { AuthProviderType } from "@/types";

const Step3Authentication = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { authMethod } = state.wizard;
  const { isAuthenticated, authProvider: userProfileAuthProvider } = state.userProfile;
  const [isProcessingAuth, setIsProcessingAuth] = useState(true);
  const hasProcessedRedirect = useRef(false);

  // Effect to process the redirect result from Google Sign-In after returning to the page
  useEffect(() => {
    if (hasProcessedRedirect.current) {
      setIsProcessingAuth(false);
      return;
    }
    
    const processRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        hasProcessedRedirect.current = true;
        
        if (result && result.user) {
          // User successfully signed in. AppProvider's onAuthStateChanged handles the profile update.
          // We just need to update the wizard's auth method.
          dispatch({ type: 'SET_AUTH_METHOD', payload: 'google' });
          toast({
            title: 'Inicio de Sesión Exitoso',
            description: `Has iniciado sesión como ${result.user.email}.`,
          });
        }
      } catch (error: any) {
        if (error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/no-redirect-operation' && error.code !== 'auth/web-storage-unsupported') {
          console.error('Error al procesar redirección de Google:', error);
          toast({ title: 'Error de Autenticación', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
        }
      } finally {
        setIsProcessingAuth(false);
      }
    };
    
    processRedirect();
  }, [dispatch, toast]);

  // Effect to sync wizard state if user is ALREADY authenticated when the component loads
  useEffect(() => {
    if (isAuthenticated && userProfileAuthProvider && !authMethod) {
      dispatch({ type: 'SET_AUTH_METHOD', payload: userProfileAuthProvider });
    }
  }, [isAuthenticated, userProfileAuthProvider, authMethod, dispatch]);

  const handleGoogleSignIn = async () => {
    setIsProcessingAuth(true);
    try {
      await signInWithRedirect(auth, googleProvider);
      // Redirect will occur, the useEffect above will handle the result on return.
    } catch (error: any) {
      console.error("Error iniciando redirección de Google Sign-In:", error);
      toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar el proceso de inicio de sesión con Google.", variant: "destructive" });
      setIsProcessingAuth(false);
    }
  };

  const handleNoAccountSignIn = () => {
    dispatch({ type: 'SET_AUTH_METHOD', payload: "no_account" });
    dispatch({ 
      type: 'UPDATE_USER_PROFILE', 
      payload: { 
        isAuthenticated: true, 
        authProvider: "no_account",
      } 
    });
    toast({ title: "Continuar sin Cuenta", description: "Procederás sin vincular una cuenta." });
  };
  
  const handleAuthSelect = (methodId: AuthProviderType) => {
    if (authMethod === methodId) return; // Don't re-trigger if already selected

    if (methodId === "google") {
      handleGoogleSignIn();
    } else if (methodId === "no_account") {
      handleNoAccountSignIn();
    }
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Autenticación de Cuenta</CardTitle>
        <CardDescription>Inicia sesión para guardar la configuración de tu asistente o continúa sin cuenta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessingAuth ? (
          <div className="flex items-center justify-center p-4 min-h-[148px]">
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
             {authMethod === "no_account" && isAuthenticated && (
              <p className="text-sm text-center text-blue-500 flex items-center justify-center gap-1 pt-2">
                <FaCheckCircle size={16} /> Has elegido continuar sin cuenta.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;
