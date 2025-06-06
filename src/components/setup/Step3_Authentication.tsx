
"use client";

import React, { useEffect, useState, useRef } from 'react'; // Added useEffect, useState, useRef
import { useApp } from "@/providers/AppProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_METHODS } from "@/config/appConfig";
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'; // Added FaSpinner
import { auth, googleProvider, signInWithRedirect, getRedirectResult, type FirebaseUser } from '@/lib/firebase'; // Updated imports
import { useToast } from "@/hooks/use-toast";
import type { AuthProviderType } from "@/types";
import { useRouter } from 'next/navigation'; // Added useRouter

const Step3Authentication = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { authMethod } = state.wizard;
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(false);
  const isProcessingRedirect = useRef(false); // To prevent re-entry

  useEffect(() => {
    let isMounted = true;

    const processRedirectResult = async () => {
      if (isProcessingRedirect.current) return;
      
      // Only attempt to get redirect result if not already authenticated by other means in this session
      // or if we are not currently in a verification step from a click.
      if (state.userProfile.isAuthenticated && state.userProfile.authProvider === 'google' && !auth.currentUser) {
        // This case might indicate user refreshed page after redirect but before processing completed.
        // Or if they were already logged in and somehow landed here.
      }


      // Check if there's a pending redirect result.
      // This is typically run once on component mount after returning from Google.
      try {
        // Small delay to ensure auth object is fully initialized if page just loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const result = await getRedirectResult(auth);
        if (result && result.user && isMounted) {
          isProcessingRedirect.current = true; // Mark as processing AFTER we get a result
          setIsVerifyingProfile(true);
          const user = result.user as FirebaseUser;
          dispatch({ type: 'SET_AUTH_METHOD', payload: 'google' });

          try {
            const token = await user.getIdToken();
            const profileResponse = await fetch(`/api/user-profile?userId=${user.uid}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (isMounted) {
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.userProfile && (profileData.userProfile.isSetupComplete || profileData.userProfile.currentPlan)) {
                  dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: profileData.userProfile });
                  toast({ title: 'Inicio de Sesión Exitoso', description: `Configuración existente cargada para ${user.email}.` });
                  router.push('/app/dashboard');
                } else {
                  dispatch({
                    type: 'UPDATE_USER_PROFILE',
                    payload: { isAuthenticated: true, authProvider: 'google', email: user.email || undefined, firebaseUid: user.uid },
                  });
                  toast({ title: 'Autenticación Exitosa', description: `Has iniciado sesión como ${user.email}. Continúa con la configuración.` });
                }
              } else {
                dispatch({
                  type: 'UPDATE_USER_PROFILE',
                  payload: { isAuthenticated: true, authProvider: 'google', email: user.email || undefined, firebaseUid: user.uid },
                });
                toast({ title: 'Autenticación Exitosa', description: `Has iniciado sesión como ${user.email}. Parece que eres nuevo por aquí.` });
              }
            }
          } catch (profileError: any) {
            console.error('Error verificando perfil post-redirección:', profileError);
            if (isMounted) {
              toast({ title: 'Error de Verificación', description: 'No se pudo verificar tu perfil. Por favor, intenta de nuevo.', variant: 'destructive' });
              dispatch({
                type: 'UPDATE_USER_PROFILE',
                payload: { isAuthenticated: true, authProvider: 'google', email: user.email || undefined, firebaseUid: user.uid },
              });
            }
          } finally {
             if(isMounted) setIsVerifyingProfile(false);
             isProcessingRedirect.current = false;
          }
        }
      } catch (error: any) {
        // Filter out "auth/redirect-cancelled-by-user" or "auth/no-redirect-operation" which are common and not "true" errors
        if (error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/no-redirect-operation' && error.code !== 'auth/web-storage-unsupported') {
          console.error('Error de autenticación con Google (redirect):', error);
          if (isMounted) {
            toast({ title: 'Error de Autenticación', description: error.message || 'No se pudo iniciar sesión con Google.', variant: 'destructive' });
          }
        }
      } finally {
        if (isMounted && !isProcessingRedirect.current) { // Ensure loading is stopped if no result and no processing
            setIsVerifyingProfile(false);
        }
      }
    };
    
    // Only run processRedirectResult if not currently in a button-triggered verification
    // and if there isn't already an auth user (which implies login happened).
    // This check is tricky. The goal is to run it on page load after redirect.
    if (!isVerifyingProfile && !auth.currentUser) {
        processRedirectResult();
    }


    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to catch redirect result

  const handleGoogleSignIn = async () => {
    setIsVerifyingProfile(true);
    try {
      await signInWithRedirect(auth, googleProvider);
      // Redirect will occur, page will reload, useEffect will handle the result.
    } catch (error: any) {
      console.error("Error iniciando redirección de Google Sign-In:", error);
      toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar el proceso de inicio de sesión con Google.", variant: "destructive" });
      setIsVerifyingProfile(false);
    }
  };

  const handleNoAccountSignIn = () => {
    setIsVerifyingProfile(true);
    dispatch({ type: 'SET_AUTH_METHOD', payload: "no_account" });
    dispatch({ 
      type: 'UPDATE_USER_PROFILE', 
      payload: { 
        isAuthenticated: true, 
        authProvider: "no_account", 
        email: "usuario@sin.cuenta", // Consider not setting a default email or UID
        firebaseUid: undefined, // Explicitly undefined
      } 
    });
    toast({ title: "Continuar sin Cuenta", description: "Procederás sin vincular una cuenta." });
    setIsVerifyingProfile(false);
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
        {isVerifyingProfile && (
          <div className="flex items-center justify-center p-4">
            <FaSpinner className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-2">Verificando...</p>
          </div>
        )}
        {!isVerifyingProfile && AUTH_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = authMethod === method.id && state.userProfile.isAuthenticated; // Check isAuthenticated
          return (
            <Button
              key={method.id}
              variant={isSelected ? "default" : "outline"}
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={() => handleAuthSelect(method.id)}
              aria-pressed={isSelected}
              disabled={isVerifyingProfile}
            >
              <Icon className={`mr-3 h-5 w-5 ${isSelected ? 'text-primary-foreground': 'text-primary'}`} />
              {method.name}
              {isSelected && <FaCheckCircle className="ml-auto h-5 w-5 text-primary-foreground" />}
            </Button>
          );
        })}
        {!isVerifyingProfile && authMethod === "google" && state.userProfile.isAuthenticated && state.userProfile.email && (
          <p className="text-sm text-center text-green-500 flex items-center justify-center gap-1 pt-2">
            <FaCheckCircle size={16} /> Autenticado con Google como {state.userProfile.email}.
          </p>
        )}
         {!isVerifyingProfile && authMethod === "no_account" && state.userProfile.isAuthenticated && (
          <p className="text-sm text-center text-blue-500 flex items-center justify-center gap-1 pt-2">
            <FaCheckCircle size={16} /> Procediendo sin vincular una cuenta.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Step3Authentication;
