"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/setup/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/setup/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/setup/Step2_DatabaseConfig';
import Step3Authentication from '@/components/setup/Step3_Authentication';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaArrowLeft, FaArrowRight, FaHome, FaSpinner } from 'react-icons/fa';
import { LogIn, UserPlus } from 'lucide-react';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, authMethod, isReconfiguring, editingAssistantId, ownerPhoneNumberForNotifications } = state.wizard;

  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  // Effect to redirect authenticated users with complete setups away from this page.
  useEffect(() => {
    if (!state.isLoading && state.userProfile.isAuthenticated && state.isSetupComplete && !isReconfiguring) {
      router.replace('/app/dashboard');
    }
  }, [state.isLoading, state.userProfile.isAuthenticated, state.isSetupComplete, isReconfiguring, router]);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  const effectiveMaxSteps = isReconfiguring 
    ? (dbNeeded ? 3 : 2) // Reconfig: 1.Details, 2.Prompt, 3.DB
    : (dbNeeded ? 4 : 3); // New: 1.Details, 2.Prompt, 3.DB, 4.Auth

  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep;
    
    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
          break;
        case 2:
          if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
          break;
        case 3:
          if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
          if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
          if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Por favor, proporciona una URL válida de Hoja de Google.";
          break;
      }
    } else {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
          break;
        case 2:
          if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
          break;
        case 3:
           if (dbNeeded) {
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
            if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
            if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Por favor, proporciona una URL válida de Hoja de Google.";
           } else {
             if (!authMethod) return "Por favor, elige un método de autenticación para continuar.";
           }
          break;
        case 4:
            if (!authMethod) return "Por favor, elige un método de autenticación para continuar.";
          break;
      }
    }
    return "Por favor, completa el paso actual.";
  };

  const isStepValid = (): boolean => {
    if (isFinalizingSetup) return false;

    if (isReconfiguring) {
      switch (currentStep) {
        case 1:
          return assistantName.trim() !== '' && selectedPurposes.size > 0 && (!selectedPurposes.has('notify_owner') || !!ownerPhoneNumberForNotifications?.trim());
        case 2:
          return assistantPrompt.trim() !== '';
        case 3:
          if (!databaseOption.type || !databaseOption.name?.trim()) return false;
          if (databaseOption.type === "google_sheets") return !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
          return true;
        default: return false;
      }
    } else {
      switch (currentStep) {
        case 1:
          return assistantName.trim() !== '' && selectedPurposes.size > 0 && (!selectedPurposes.has('notify_owner') || !!ownerPhoneNumberForNotifications?.trim());
        case 2:
          return assistantPrompt.trim() !== '';
        case 3:
          if (dbNeeded) {
            if (!databaseOption.type || !databaseOption.name?.trim()) return false;
            if (databaseOption.type === "google_sheets") return !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            return true;
          } else {
            return !!authMethod;
          }
        case 4:
           return !!authMethod;
        default: return false;
      }
    }
  };

  const handleAuthSuccess = () => {
    // This function is called after successful authentication from Step3.
    // In this simplified flow, the next action is to complete the setup.
    handleCompleteSetup();
  };
  
  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 2 && !dbNeeded && !isReconfiguring) {
        dispatch({ type: 'SET_WIZARD_STEP', payload: 4 });
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
    if (currentStep === 4 && !dbNeeded && !isReconfiguring) {
      dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
    } else if (currentStep > 1) {
      dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
    }
  };

  const handleCompleteSetup = async () => {
    if (isReconfiguring && !isStepValid()) {
        toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
        return;
    }
    if (!isReconfiguring && !state.userProfile.isAuthenticated) {
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
    };
    
    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    setIsFinalizingSetup(false);

    if (!editingAssistantId) {
        sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, newDbEntry || null)
            .catch(err => console.error("Error sending assistant created webhook:", err));
    }

    toast({
        title: isReconfiguring ? "¡Asistente Actualizado!" : "¡Configuración Completa!",
        description: `${finalAssistantConfig.name} ${isReconfiguring ? 'ha sido actualizado.' : `está listo.`}`,
    });
    router.push('/app/dashboard');
  };

  const handleAuthFlow = async () => {
    if (!googleProvider) {
      toast({ title: "Configuración Incompleta", description: "La autenticación de Firebase no está configurada.", variant: "destructive" });
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged listener in AppProvider and the useEffect hooks
      // will handle fetching data and redirecting to the dashboard if the user is existing.
      toast({ title: "Autenticación exitosa", description: "Verificando tu cuenta..." });
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
      }
    }
  };

  const renderStepContent = () => {
    if (isReconfiguring) {
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return <Step2AssistantPrompt />;
      if (currentStep === 3) return <Step2DatabaseConfig />;
      return null;
    } else {
      if (currentStep === 1) return <Step1AssistantDetails />;
      if (currentStep === 2) return <Step2AssistantPrompt />;
      if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : <Step3Authentication onSuccess={handleAuthSuccess} />;
      if (currentStep === 4) return dbNeeded ? <Step3Authentication onSuccess={handleAuthSuccess} /> : null;
      return null;
    }
  };

  if (state.isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
    );
  }

  // Show welcome screen ONLY if the user is not authenticated and not in a reconfiguration flow.
  if (!state.userProfile.isAuthenticated && !isReconfiguring) {
    return (
      <PageContainer>
        <Card className="w-full max-w-md mx-auto shadow-xl animate-fadeIn mt-10 sm:mt-16">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Bienvenido/a a {APP_NAME}!</CardTitle>
            <CardDescription className="text-center pt-1">¿Cómo deseas comenzar?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={handleAuthFlow}
            >
              <LogIn className="mr-3 h-5 w-5 text-primary" />
              Iniciar sesión
            </Button>
            <Button
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90"
              onClick={handleAuthFlow} // Both buttons now trigger the same auth flow
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Define tu Asistente
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // If authenticated OR reconfiguring, show the wizard.
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
              <Button variant="outline" onClick={() => router.push('/app/dashboard')} className="transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={isFinalizingSetup}>
                <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
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
              {isReconfiguring ? 'Guardar Cambios' : 'Completar Configuración'}
              {!isReconfiguring && <FaArrowRight className="ml-1 h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;
