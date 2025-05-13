
"use client";

import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, type FirebaseUser } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { AuthProviderType } from "@/types";

const Step3Authentication = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { authMethod } = state.wizard;

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user as FirebaseUser;
      dispatch({ type: 'SET_AUTH_METHOD', payload: "google" });
      dispatch({ 
        type: 'UPDATE_USER_PROFILE', 
        payload: { 
          isAuthenticated: true, 
          authProvider: "google", 
          email: user.email || "usuario@google.com", // Use actual email
          firebaseUid: user.uid,
        } 
      });
      toast({ title: "Autenticación Exitosa", description: `Has iniciado sesión como ${user.email}.` });
    } catch (error: any) {
      console.error("Error de autenticación con Google:", error);
      toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
    }
  };

  const handleNoAccountSignIn = () => {
    dispatch({ type: 'SET_AUTH_METHOD', payload: "no_account" });
    dispatch({ 
      type: 'UPDATE_USER_PROFILE', 
      payload: { 
        isAuthenticated: true, // Consider if this should be false or true based on flow
        authProvider: "no_account", 
        email: "usuario@sin.cuenta",
        firebaseUid: undefined,
      } 
    });
    toast({ title: "Continuar sin Cuenta", description: "Procederás sin vincular una cuenta." });
  };

  const handleAuthSelect = (methodId: AuthProviderType) => {
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
            >
              <Icon className={`mr-3 h-5 w-5 ${isSelected ? 'text-primary-foreground': 'text-primary'}`} />
              {method.name}
              {isSelected && <CheckCircle2 className="ml-auto h-5 w-5 text-primary-foreground" />}
            </Button>
          );
        })}
        {authMethod === "google" && state.userProfile.email && state.userProfile.email !== "usuario@sin.cuenta" && (
          <p className="text-sm text-center text-green-500 flex items-center justify-center gap-1 pt-2">
            <CheckCircle2 size={16} /> Autenticado con Google como {state.userProfile.email}.
          </p>
        )}
        {authMethod === "no_account" && (
          <p className="text-sm text-center text-blue-500 flex items-center justify-center gap-1 pt-2">
            <CheckCircle2 size={16} /> Procediendo sin vincular una cuenta.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;
