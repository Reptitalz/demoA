
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/setup/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/setup/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/setup/Step2_DatabaseConfig';
import Step3Authentication from '@/components/setup/Step3_Authentication';
import Step5_TermsAndConditions from '@/components/setup/Step5_TermsAndConditions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaArrowLeft, FaArrowRight, FaHome, FaSpinner, FaGoogle } from 'react-icons/fa';
import { UserPlus } from 'lucide-react';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { auth, googleProvider, signInWithRedirect } from '@/lib/firebase';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const AppRootPageContent = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, authMethod, isReconfiguring, editingAssistantId, ownerPhoneNumberForNotifications, acceptedTerms } = state.wizard;
  const { userProfile, isSetupComplete } = state;
  
  const [showWizard, setShowWizard] = useState(false);
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  useEffect(() => {
    if (!state.isLoading) {
        // If user is authenticated
        if (userProfile.isAuthenticated) {
            const action = searchParams.get('action');
            // If they want to add a new assistant or are reconfiguring one, show wizard.
            if (action === 'add' || isReconfiguring) {
                setShowWizard(true);
            } 
            // If they have completed setup and are not trying to add/reconfigure, send to dashboard.
            else if (isSetupComplete) {
                router.replace('/dashboard');
            } 
            // Otherwise, they are a new user part-way through setup, so show wizard.
            else {
                setShowWizard(true);
            }
        } 
        // If not authenticated, we can infer they need to see the welcome/login screen.
        else {
            const action = searchParams.get('action');
            if (action === 'add') {
                setShowWizard(true);
            } else {
                setShowWizard(false);
            }
        }
    }
  }, [state.isLoading, userProfile.isAuthenticated, isSetupComplete, router, isReconfiguring, searchParams]);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  
  const isAddingNewForExistingUser = !isReconfiguring && isSetupComplete;

  const effectiveMaxSteps = (() => {
    if (isReconfiguring) { // Reconfiguring an assistant
      return dbNeeded ? 4 : 3;
    }
    if (isAddingNewForExistingUser) { // Adding a new assistant
      return dbNeeded ? 3 : 2;
    }
    // First time setup for a new user
    return dbNeeded ? 5 : 4;
  })();

  const getValidationMessage = (): string | null => {
    const validateStep1 = () => {
      if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
      if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito.";
      if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
      return null;
    }
    const validateStep2 = () => {
      if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
      return null;
    }
    const validateDbStep = () => {
      if (!dbNeeded) return null;
      if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
      if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
      if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Por favor, proporciona una URL válida de Hoja de Google.";
      return null;
    }
    const validateAuthStep = () => {
      if (!authMethod) return "Por favor, elige un método de autenticación.";
      return null;
    }
    const validateTermsStep = () => {
      if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
      return null;
    }
    
    let message: string | null = null;
    if (isReconfiguring) {
      if (currentStep === 1) message = validateStep1();
      else if (currentStep === 2) message = validateStep2();
      else if (currentStep === 3) message = dbNeeded ? validateDbStep() : validateTermsStep();
      else if (currentStep === 4) message = dbNeeded ? validateTermsStep() : null;
    } else if (isAddingNewForExistingUser) {
      if (currentStep === 1) message = validateStep1();
      else if (currentStep === 2) message = validateStep2();
      else if (currentStep === 3) message = dbNeeded ? validateDbStep() : null;
    } else { // New user
      if (currentStep === 1) message = validateStep1();
      else if (currentStep === 2) message = validateStep2();
      else if (currentStep === 3) message = dbNeeded ? <Step2DatabaseConfig /> : <Step3Authentication />;
      else if (currentStep === 4) message = dbNeeded ? <Step3Authentication /> : <Step5_TermsAndConditions />;
      else if (currentStep === 5) message = dbNeeded ? <Step5_TermsAndConditions /> : null;
    }

    return message;
  };
  
  const isStepValid = (): boolean => {
    if (isFinalizingSetup) return false;
    return getValidationMessage() === null;
  };


  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep < effectiveMaxSteps) {
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
    if (currentStep > 1) {
      dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
    }
  };

  const handleCompleteSetup = async () => {
    const validationError = getValidationMessage();
    if (validationError) {
        toast({ title: "Error", description: validationError, variant: "destructive" });
        return;
    }

    if (!isAddingNewForExistingUser && !isReconfiguring && !state.userProfile.isAuthenticated) {
        toast({ title: "Autenticación Requerida", description: "Por favor, inicia sesión para completar la configuración.", variant: "destructive" });
        return;
    }
    
    setIsFinalizingSetup(true);

    const newAssistantDbIdToLink = (dbNeeded && state.wizard.databaseOption.type) 
        ? `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` 
        : undefined;

    const newDbEntry: DatabaseConfig | undefined = newAssistantDbIdToLink ? {
        id: newAssistantDbIdToLink,
        name: state.wizard.databaseOption.name!,
        source: state.wizard.databaseOption.type!,
        details: state.wizard.databaseOption.name,
        accessUrl: state.wizard.databaseOption.type === 'google_sheets' ? state.wizard.databaseOption.accessUrl : undefined,
    } : undefined;

    let updatedAssistantsArray: AssistantConfig[];
    let finalAssistantConfig: AssistantConfig;

    if (editingAssistantId) {
        const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
        finalAssistantConfig = {
            ...assistantToUpdate,
            name: assistantName,
            prompt: assistantPrompt,
            purposes: selectedPurposes,
            databaseId: newAssistantDbIdToLink ?? (dbNeeded ? assistantToUpdate.databaseId : undefined),
        };
        updatedAssistantsArray = state.userProfile.assistants.map(a => a.id === editingAssistantId ? finalAssistantConfig : a);
    } else {
        finalAssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName,
            prompt: assistantPrompt,
            purposes: selectedPurposes,
            databaseId: newAssistantDbIdToLink,
            imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
        };
        updatedAssistantsArray = [...state.userProfile.assistants, finalAssistantConfig];
    }
    
    let updatedDatabasesArray = [...state.userProfile.databases];
    if (newDbEntry) {
        updatedDatabasesArray.push(newDbEntry);
    }

    if (editingAssistantId && (newAssistantDbIdToLink || !dbNeeded)) {
        const oldDbId = state.userProfile.assistants.find(a => a.id === editingAssistantId)?.databaseId;
        if (oldDbId && (!dbNeeded || (newAssistantDbIdToLink && oldDbId !== newAssistantDbIdToLink))) {
            const isOldDbUsedByOthers = updatedAssistantsArray.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers) {
                updatedDatabasesArray = updatedDatabasesArray.filter(db => db.id !== oldDbId);
            }
        }
    }

    const finalUserProfile: UserProfile = {
        ...state.userProfile,
        assistants: updatedAssistantsArray,
        databases: updatedDatabasesArray,
        ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications,
        credits: state.userProfile.credits || 0,
    };
    
    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    setIsFinalizingSetup(false);

    if (!editingAssistantId) {
        sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, newDbEntry || null)
            .catch(err => console.error("Error sending assistant created webhook:", err));
    }

    toast({
        title: isReconfiguring || isAddingNewForExistingUser ? "¡Asistente Guardado!" : "¡Configuración Completa!",
        description: `${finalAssistantConfig.name} ${isReconfiguring ? 'ha sido actualizado.' : `está listo.`}`,
    });
    router.push('/dashboard');
  };

  const handleLogin = async () => {
    if (!googleProvider) {
      toast({ title: "Configuración Incompleta", description: "La autenticación de Firebase no está configurada.", variant: "destructive" });
      return;
    }
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
    }
  };

  const handleStartSetup = () => {
    // We navigate to the same page but with a query param to indicate the user's intent.
    router.push('/app?action=add');
  };
  
  const handleGoToAppRoot = () => {
    dispatch({ type: 'RESET_WIZARD' });
    router.push('/app');
  };

  const renderStepContent = () => {
    if (isReconfiguring) {
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return <Step2AssistantPrompt />;
      if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : <Step5_TermsAndConditions />;
      if (currentStep === 4) return dbNeeded ? <Step5_TermsAndConditions /> : null;
    } else if (isAddingNewForExistingUser) {
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return <Step2AssistantPrompt />;
      if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : null;
    } else { // New user
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return <Step2AssistantPrompt />;
      if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : <Step3Authentication />;
      if (currentStep === 4) return dbNeeded ? <Step3Authentication /> : <Step5_TermsAndConditions />;
      if (currentStep === 5) return dbNeeded ? <Step5_TermsAndConditions /> : null;
    }
    return null;
  };


  if (state.isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
    );
  }

  if (!showWizard) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <Card className="w-full max-w-lg mx-auto shadow-xl animate-fadeIn p-4 sm:p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl">Bienvenido/a a {APP_NAME}</CardTitle>
            <CardDescription className="pt-2">
              ¿Ya tienes una cuenta o quieres crear tu primer asistente?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={handleLogin}
            >
              <FaGoogle className="mr-3 h-5 w-5 text-primary" />
              Iniciar con Google
            </Button>
            <Button
              size="lg"
              className="w-full justify-center text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90"
              onClick={handleStartSetup}
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Crear Asistente
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }
  
  // Show wizard if conditions are met
  if (showWizard) {
    return (
      <PageContainer>
        <div className="space-y-5">
          <SetupProgressBar />
          <div className="min-h-[350px] relative">
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
              {state.isSetupComplete ? (
                <Button variant="outline" onClick={() => router.push('/dashboard')} className="transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={isFinalizingSetup}>
                  <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
                </Button>
              ) : (
                <Button variant="outline" onClick={handleGoToAppRoot} className="transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={isFinalizingSetup}>
                  <FaHome className="mr-1 h-3 w-3" /> Volver al Inicio
                </Button>
              )}
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isFinalizingSetup} className="transition-transform transform hover:scale-105 text-xs px-2 py-1">
                <FaArrowLeft className="mr-1 h-3 w-3" /> Anterior
              </Button>
            </div>
            {currentStep < effectiveMaxSteps ? (
              <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={!isStepValid() || isFinalizingSetup}>
                Siguiente <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              <Button onClick={handleCompleteSetup} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={!isStepValid() || isFinalizingSetup}>
                {isFinalizingSetup && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
                {isReconfiguring || isAddingNewForExistingUser ? 'Guardar Asistente' : 'Completar Configuración'}
                <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }
  
  // Fallback loading state while routing decision is being made
  return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
  );
};

const AppRootPage = () => {
  return (
    <Suspense fallback={
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    }>
      <AppRootPageContent />
    </Suspense>
  );
}

export default AppRootPage;
