
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/setup/Step1_AssistantDetails';
import Step2DatabaseConfig from '@/components/setup/Step2_DatabaseConfig';
import Step3Authentication from '@/components/setup/Step3_Authentication';
import Step4SubscriptionPlan from '@/components/setup/Step4_SubscriptionPlan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaArrowLeft, FaArrowRight, FaHome, FaSpinner, FaEye } from 'react-icons/fa';
import { LogIn, UserPlus } from 'lucide-react';
import type { UserProfile, AssistantConfig, DatabaseConfig, DatabaseSource } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, MAX_WIZARD_STEPS, DEFAULT_FREE_PLAN_PHONE_NUMBER, DEFAULT_ASSISTANT_IMAGE_URL, subscriptionPlansConfig } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan, isReconfiguring, editingAssistantId, ownerPhoneNumberForNotifications } = state.wizard;

  const [userHasMadeInitialChoice, setUserHasMadeInitialChoice] = useState(false);
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated || isReconfiguring) {
      setUserHasMadeInitialChoice(true);
    }
  }, [state.userProfile.isAuthenticated, isReconfiguring]);


  const effectiveMaxSteps = isReconfiguring
    ? (needsDatabaseConfiguration() ? 3 : 2) // Details, DB (Opt), Plan
    : (needsDatabaseConfiguration() ? MAX_WIZARD_STEPS : MAX_WIZARD_STEPS - 1); // Details, DB (Opt), Auth, Plan


  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep;
    const dbNeeded = needsDatabaseConfiguration();

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: // Assistant Details
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) {
            return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
          }
          break;
        case 2: // DB config or Plan
          if (dbNeeded) { // DB config
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
            if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
            if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) {
              return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
          } else { // Plan (if DB not needed, this is step 2)
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 3: // Plan (if DB was needed and was step 2)
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    } else { // Standard flow
      switch (currentValidationStep) {
        case 1: // Assistant Details
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) {
            return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
          }
          break;
        case 2: // DB Config or Auth
           if (dbNeeded) { // DB config
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
            if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
            if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) {
              return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
           } else { // Auth (if DB not needed, this is step 2)
             if (!authMethod) return "Por favor, elige un método de autenticación para continuar.";
           }
          break;
        case 3: // Auth or Plan
          if (dbNeeded) { // Auth
            if (!authMethod) return "Por favor, elige un método de autenticación para continuar.";
          } else { // Plan (if DB not needed, this is step 3)
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 4: // Plan (if DB was present)
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    }
    return "Por favor, completa el paso actual.";
  };

  const isStepValid = (): boolean => {
    const currentValidationStep = currentStep;
    const dbNeeded = needsDatabaseConfiguration();

    if (isFinalizingSetup) return false;

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1:
          const reconfigBaseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          let reconfigNotifyOwnerValid = true;
          if (selectedPurposes.has('notify_owner')) {
            reconfigNotifyOwnerValid = !!ownerPhoneNumberForNotifications?.trim();
          }
          return reconfigBaseValid && reconfigNotifyOwnerValid;
        case 2: // DB or Plan
          if (dbNeeded) { // DB config
            if (!databaseOption.type) return false;
            if (!databaseOption.name?.trim()) return false;
            if (databaseOption.type === "google_sheets") {
                return !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            return true; // For smart_db, name is enough
          } else { // Plan
            return !!selectedPlan;
          }
        case 3: // Plan
          return !!selectedPlan;
        default: return false;
      }
    } else { // Standard flow
      switch (currentValidationStep) {
        case 1: // Details
          const baseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          let notifyOwnerValid = true;
          if (selectedPurposes.has('notify_owner')) {
            notifyOwnerValid = !!ownerPhoneNumberForNotifications?.trim();
          }
          return baseValid && notifyOwnerValid;
        case 2: // DB or Auth
          if (dbNeeded) { // DB
            if (!databaseOption.type) return false;
            if (!databaseOption.name?.trim()) return false;
            if (databaseOption.type === "google_sheets") {
                return !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            return true; // For smart_db, name is enough
          } else { // Auth
            return !!authMethod;
          }
        case 3: // Auth or Plan
           if (dbNeeded) { // Auth
            return !!authMethod;
           } else { // Plan
            return !!selectedPlan;
           }
        case 4: // Plan
          return !!selectedPlan;
        default: return false;
      }
    }
  };

  const handleAuthSuccess = () => {
    const dbNeeded = needsDatabaseConfiguration();
    const nextStep = dbNeeded ? 4 : 3;
    dispatch({ type: 'SET_WIZARD_STEP', payload: nextStep });
  };
  

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 1 && !needsDatabaseConfiguration()) { // Skip DB step if not needed
        if (isReconfiguring) { // Reconfig: Details -> Plan
          dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
        } else { // New Setup: Details -> Auth
          dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); // Go from step 1 to 3 (Auth)
        }
      } else if (currentStep < effectiveMaxSteps) {
        dispatch({ type: 'NEXT_WIZARD_STEP' });
      }
    } else {
      toast({
        title: "Error de Validación",
        description: getValidationMessage(),
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep === 3 && !needsDatabaseConfiguration() && !isReconfiguring) { // Came from Details to Auth, go back to Details
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
    } else if (currentStep === 2 && !needsDatabaseConfiguration() && isReconfiguring) { // Came from Details to Plan (reconfig), go back to Details
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
    }
    else if (currentStep > 1) {
      dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
    }
  };

  const handleCompleteSetup = async () => {
    if (!isStepValid()) {
        toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
        return;
    }
    
    if (state.userProfile.isGuest) {
      toast({
          title: "Modo de Demostración",
          description: "Para guardar los cambios, por favor, crea una cuenta.",
          variant: "destructive"
      });
      setIsFinalizingSetup(false);
      return;
    }

    setIsFinalizingSetup(true);

    // --- 1. Build the final user profile object based on wizard state ---
    let currentDatabaseOption = { ...state.wizard.databaseOption }; 
    let finalAssistantConfig: AssistantConfig;
    let updatedAssistantsArray: AssistantConfig[];
    const newDbEntries: DatabaseConfig[] = [];
    let newAssistantDbIdToLink: string | undefined = undefined;
    let assistantPhoneNumber: string | undefined;
    let assistantImageUrl: string = DEFAULT_ASSISTANT_IMAGE_URL;
    let finalAssistantName = assistantName;
    let baseAssistantsArray = state.userProfile.assistants;
    const wasOnFreeOrNoPlan = !state.userProfile.currentPlan || state.userProfile.currentPlan === 'free';
    const isUpgradingToPaid = selectedPlan && (selectedPlan === 'premium_179' || selectedPlan === 'business_270');

    if (!editingAssistantId && wasOnFreeOrNoPlan && isUpgradingToPaid) {
        baseAssistantsArray = state.userProfile.assistants.filter(
            asst => asst.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER
        );
    }
    
    if (editingAssistantId) {
        const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
        assistantImageUrl = assistantToUpdate.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL;
        assistantPhoneNumber = (selectedPlan === 'free') 
            ? DEFAULT_FREE_PLAN_PHONE_NUMBER 
            : (assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined);
    } else { // New assistant
        assistantImageUrl = DEFAULT_ASSISTANT_IMAGE_URL;
        assistantPhoneNumber = (selectedPlan === 'free') 
            ? DEFAULT_FREE_PLAN_PHONE_NUMBER 
            : undefined; // No custom phone number at creation
        if (selectedPlan === 'free' && state.userProfile.assistants.length === 0) {
            finalAssistantName = "Hey Asistente";
        }
    }
    if (needsDatabaseConfiguration() && currentDatabaseOption.type) {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newDbEntries.push({
        id: dbId,
        name: currentDatabaseOption.name || `Mi ${currentDatabaseOption.type === 'google_sheets' ? 'Hoja de Google' : 'Base Inteligente'}`,
        source: currentDatabaseOption.type,
        details: currentDatabaseOption.name,
        accessUrl: currentDatabaseOption.type === 'google_sheets' ? currentDatabaseOption.accessUrl : undefined,
      });
      newAssistantDbIdToLink = dbId;
    } else if (!needsDatabaseConfiguration()) {
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: null, name: '', accessUrl: '' } });
    }
    if (editingAssistantId) {
      const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
      finalAssistantConfig = { ...assistantToUpdate, name: finalAssistantName, purposes: selectedPurposes, phoneLinked: assistantPhoneNumber, databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink : (needsDatabaseConfiguration() ? assistantToUpdate.databaseId : undefined), imageUrl: assistantImageUrl };
      updatedAssistantsArray = baseAssistantsArray.map(asst => asst.id === editingAssistantId ? finalAssistantConfig : asst);
    } else {
      finalAssistantConfig = { id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, name: finalAssistantName, purposes: selectedPurposes, phoneLinked: assistantPhoneNumber, databaseId: newAssistantDbIdToLink, imageUrl: assistantImageUrl };
      updatedAssistantsArray = [...baseAssistantsArray, finalAssistantConfig];
    }
    let updatedDatabasesArray = [...state.userProfile.databases, ...newDbEntries];
    if (editingAssistantId && (newAssistantDbIdToLink || !needsDatabaseConfiguration())) {
        const oldDbId = state.userProfile.assistants.find(a => a.id === editingAssistantId)?.databaseId;
        if (oldDbId && (!needsDatabaseConfiguration() || (newAssistantDbIdToLink && oldDbId !== newAssistantDbIdToLink))) {
            const isOldDbUsedByOthers = updatedAssistantsArray.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers) {
                updatedDatabasesArray = updatedDatabasesArray.filter(db => db.id !== oldDbId);
            }
        }
    }
    // --- End of profile build logic ---

    const planDetails = subscriptionPlansConfig.find(p => p.id === selectedPlan);

    // --- 2. Branch logic for Free/Test vs. Paid plans ---
    if (selectedPlan && selectedPlan !== 'free' && planDetails?.stripePriceId) {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast({ title: "No autenticado", description: "Debes iniciar sesión para comprar un plan.", variant: "destructive" });
                setIsFinalizingSetup(false);
                router.push('/app/setup');
                return;
            }
            const token = await currentUser.getIdToken();

            // First, save the assistant/db configuration but keep the *current* plan.
            const profileToSavePrePayment: UserProfile = { ...state.userProfile, assistants: updatedAssistantsArray, databases: updatedDatabasesArray, ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications };
            const saveResponse = await fetch('/api/user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: currentUser.uid, userProfile: profileToSavePrePayment }),
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.message || 'No se pudo guardar la configuración del asistente antes del pago.');
            }

            // Then, create the checkout session.
            const checkoutResponse = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ planId: selectedPlan }),
            });

            const checkoutData = await checkoutResponse.json();
            if (!checkoutResponse.ok) {
                throw new Error(checkoutData.error || 'No se pudo crear la sesión de pago.');
            }
            
            // Optimistically update local state with new assistant/db before redirecting.
            dispatch({ type: 'COMPLETE_SETUP', payload: profileToSavePrePayment });
            router.push(checkoutData.url);

        } catch (error: any) {
            console.error("Error processing paid plan selection:", error);
            toast({ title: "Error al proceder al pago", description: error.message || "Ocurrió un error. Por favor, inténtalo de nuevo.", variant: "destructive" });
            setIsFinalizingSetup(false);
        }
    } else {
        // This handles the 'free' plan and any non-purchasable plans (like 'test_plan').
        const finalUserProfile: UserProfile = { ...state.userProfile, currentPlan: selectedPlan, assistants: updatedAssistantsArray, databases: updatedDatabasesArray, ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications };
        
        dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
        setIsFinalizingSetup(false);

        if (!editingAssistantId && finalAssistantConfig) {
            sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, newDbEntries.find(db => db.id === newAssistantDbIdToLink) || null)
                .catch(err => console.error("Error sending assistant created webhook:", err));
        }

        toast({
            title: isReconfiguring ? "¡Asistente Actualizado!" : "¡Configuración Completa!",
            description: `${finalAssistantConfig.name} ${isReconfiguring ? 'ha sido actualizado.' : `está listo.`}`,
            action: <Button variant="ghost" size="sm" onClick={() => router.push('/app/dashboard')}>Ir al Panel</Button>,
        });
        router.push('/app/dashboard');
    }
};

  const handleAuthFlow = async (flowType: 'create' | 'login') => {
    if (!googleProvider) {
      toast({
        title: "Configuración Incompleta",
        description: "La autenticación de Firebase no está configurada. Por favor, revisa las variables de entorno.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        if (flowType === 'create') {
          // For 'Create', always reset and go to step 1
          dispatch({ type: 'RESET_WIZARD' });
          setUserHasMadeInitialChoice(true);
          dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
          toast({ title: "Define tu Asistente", description: "Comencemos a definir tu asistente."});
        } else {
          // For 'Login', the AppProvider's onAuthStateChanged listener will handle
          // fetching the profile and redirecting to the dashboard if setup is complete.
          toast({
            title: "Inicio de sesión exitoso",
            description: "Redirigiendo...",
          });
        }
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Error de inicio de sesión con Google:", error);
        toast({
          title: "Error de Autenticación",
          description: error.message || "No se pudo iniciar sesión con Google.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGuestSession = () => {
    dispatch({ type: 'START_GUEST_SESSION' });
    router.push('/app/dashboard');
    toast({
        title: "Modo de Demostración",
        description: "Estás viendo el panel con datos de ejemplo."
    });
  };


  const renderStepContent = () => {
    const dbNeeded = needsDatabaseConfiguration();

    if (isReconfiguring) {
      // Reconfiguring flow: Details -> DB (optional) -> Plan
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return dbNeeded ? <Step2DatabaseConfig /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
      if (currentStep === 3) return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
      return null;
    } else {
      // Standard new setup flow based on logical steps
      // Step 1: Details
      if (currentStep === 1) return <Step1AssistantDetails />;
      // Step 2: DB (if needed) or Auth
      if (currentStep === 2) {
        return dbNeeded ? <Step2DatabaseConfig /> : <Step3Authentication onSuccess={handleAuthSuccess} />;
      }
      // Step 3: Auth (if DB was needed) or Plan
      if (currentStep === 3) {
        return dbNeeded ? <Step3Authentication onSuccess={handleAuthSuccess} /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
      }
      // Step 4: Plan (if DB was needed)
      if (currentStep === 4) return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
      
      return null;
    }
  };


  if (!state.userProfile.isAuthenticated && !state.wizard.isReconfiguring && !userHasMadeInitialChoice) {
    return (
      <PageContainer>
        <Card className="w-full max-w-md mx-auto shadow-xl animate-fadeIn mt-10 sm:mt-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Bienvenido/a a {APP_NAME}!</CardTitle>
            <CardDescription className="text-center pt-1">
              ¿Cómo deseas comenzar?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90"
              onClick={() => handleAuthFlow('create')}
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Crear Nuevo Asistente
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={() => handleAuthFlow('login')}
            >
              <LogIn className="mr-3 h-5 w-5 text-primary" />
              Iniciar Sesión
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={handleGuestSession}
            >
              <FaEye className="mr-3 h-5 w-5 text-primary" />
              Continuar sin cuenta (Ver demo)
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }


  return (
    <PageContainer>
      <div className="space-y-5">
        <SetupProgressBar />
        <div className="min-h-[260px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[350px] relative">
         {isFinalizingSetup && (
            <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 rounded-md">
              <FaSpinner className="animate-spin h-10 w-10 text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Finalizando configuración...</p>
            </div>
          )}
         {renderStepContent()}
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-1.5">
            {state.isSetupComplete && !isReconfiguring && (
              <Button
                variant="outline"
                onClick={() => {
                  dispatch({ type: 'RESET_WIZARD' });
                  router.push('/app/dashboard');
                }}
                className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
                disabled={isFinalizingSetup}
              >
                <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isFinalizingSetup}
              className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
            >
              <FaArrowLeft className="mr-1 h-3 w-3" /> Anterior
            </Button>
          </div>

          {currentStep < effectiveMaxSteps && (
            <Button
              onClick={handleNext}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() || isFinalizingSetup}
            >
              Siguiente <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
          {currentStep === effectiveMaxSteps && (
             <Button
              onClick={handleCompleteSetup}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() || isFinalizingSetup}
            >
              {isFinalizingSetup && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"}
              {!isFinalizingSetup && <FaArrowRight className="ml-1 h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;
