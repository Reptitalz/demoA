"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/auth/wizard-steps/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/auth/wizard-steps/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/auth/wizard-steps/Step2_DatabaseConfig';
import Step4CreateCredentials from '@/components/auth/wizard-steps/Step4_CreateCredentials';
import Step5TermsAndConditions from '@/components/auth/wizard-steps/Step5_TermsAndConditions';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight, FaHome, FaSpinner } from 'react-icons/fa';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { isValidPhoneNumber } from 'react-phone-number-input';

// This page is now primarily for RECONFIGURING an existing assistant.
// The initial creation flow is handled in a dialog on the /login page.

const AppSetupPageContent = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, isReconfiguring, editingAssistantId, ownerPhoneNumberForNotifications, acceptedTerms } = state.wizard;
  const { userProfile, isSetupComplete } = state;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  useEffect(() => {
    // If not authenticated and not explicitly reconfiguring, redirect to login.
    // This protects the reconfiguration route.
    if (!state.isLoading && !state.userProfile.isAuthenticated) {
      router.replace('/login');
    }
  }, [state.isLoading, state.userProfile.isAuthenticated, router]);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  
  // This page is only for reconfiguring, so the steps are fixed.
  const effectiveMaxSteps = dbNeeded ? 4 : 3;

  const getValidationMessage = (): string | null => {
    if (!isReconfiguring) return "Esta página es solo para reconfigurar asistentes.";

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
    const validateTermsStep = () => {
      if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
      return null;
    }
    
    let message: string | null = null;
    if (currentStep === 1) message = validateStep1();
    else if (currentStep === 2) message = validateStep2();
    else if (currentStep === 3) message = dbNeeded ? validateDbStep() : validateTermsStep();
    else if (currentStep === 4) message = dbNeeded ? validateTermsStep() : null;

    return message;
  };
  
  const isStepValid = (): boolean => {
    if (isFinalizingSetup) return false;
    return getValidationMessage() === null;
  };

  const handleNext = () => {
    const validationError = getValidationMessage();
    if (validationError) {
      toast({
        title: "Error de Validación",
        description: validationError,
        variant: "destructive",
      });
      return;
    }
    if (currentStep < effectiveMaxSteps) {
      dispatch({ type: 'NEXT_WIZARD_STEP' });
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
    
    if (!editingAssistantId || !isReconfiguring) {
      toast({ title: "Error", description: "No se está reconfigurando ningún asistente.", variant: "destructive" });
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
        accessUrl: databaseOption.type === 'google_sheets' ? databaseOption.accessUrl : undefined,
    } : undefined;

    const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
    const finalAssistantConfig: AssistantConfig = {
        ...assistantToUpdate,
        name: assistantName,
        prompt: assistantPrompt,
        purposes: selectedPurposes,
        databaseId: newAssistantDbIdToLink ?? (dbNeeded ? assistantToUpdate.databaseId : undefined),
    };
    
    let updatedAssistantsArray = state.userProfile.assistants.map(a => a.id === editingAssistantId ? finalAssistantConfig : a);
    let updatedDatabasesArray = [...(state.userProfile.databases || [])];
    if (newDbEntry) {
        updatedDatabasesArray.push(newDbEntry);
    }

    // Garbage-collect old database if no longer used
    if (newAssistantDbIdToLink || !dbNeeded) {
        const oldDbId = assistantToUpdate.databaseId;
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
    
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: finalUserProfile });
    setIsFinalizingSetup(false);

    toast({
        title: "¡Asistente Guardado!",
        description: `${finalAssistantConfig.name} ha sido actualizado.`,
    });
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    if (!isReconfiguring) return null; // Should not be rendered if not reconfiguring
    if (currentStep === 1) return <Step1AssistantDetails />;
    if (currentStep === 2) return <Step2AssistantPrompt />;
    if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : <Step5TermsAndConditions />;
    if (currentStep === 4) return dbNeeded ? <Step5TermsAndConditions /> : null;
    return null;
  };

  if (state.isLoading || !isReconfiguring) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
        <LoadingSpinner size={36} />
      </PageContainer>
    );
  }

  // Render the wizard for reconfiguration
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
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="transition-transform transform hover:scale-105 text-xs px-2 py-1" disabled={isFinalizingSetup}>
              <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
            </Button>
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
              {isFinalizingSetup ? <FaSpinner className="animate-spin mr-1 h-3 w-3" /> : null}
              Guardar Asistente
              <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

const AppSetupPage = () => {
  return (
    <Suspense fallback={
        <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
            <LoadingSpinner size={36} />
        </PageContainer>
    }>
      <AppSetupPageContent />
    </Suspense>
  );
}

export default AppSetupPage;

    