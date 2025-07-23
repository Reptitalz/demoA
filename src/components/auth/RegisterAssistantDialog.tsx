"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/auth/wizard-steps/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/auth/wizard-steps/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/auth/wizard-steps/Step2_DatabaseConfig';
import Step4CreateCredentials from '@/components/auth/wizard-steps/Step4_CreateCredentials';
import Step5TermsAndConditions from '@/components/auth/wizard-steps/Step5_TermsAndConditions';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight, FaSpinner } from 'react-icons/fa';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface RegisterAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterAssistantDialog = ({ isOpen, onOpenChange }: RegisterAssistantDialogProps) => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, ownerPhoneNumberForNotifications, acceptedTerms, phoneNumber, password, confirmPassword } = state.wizard;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  const effectiveMaxSteps = dbNeeded ? 5 : 4;

  const getValidationMessage = (): string | null => {
    const validateStep1 = () => {
      if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
      if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito.";
      if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu número de WhatsApp para recibir notificaciones.";
      return null;
    };
    const validateStep2 = () => {
      if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
      return null;
    };
    const validateDbStep = () => {
      if (!dbNeeded) return null;
      if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
      if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
      if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Por favor, proporciona una URL válida de Hoja de Google.";
      return null;
    };
    const validateAuthStep = () => {
      if (!isValidPhoneNumber(phoneNumber || '')) return "Por favor, proporciona un número de teléfono válido.";
      if (!password || password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (password !== confirmPassword) return "Las contraseñas no coinciden.";
      return null;
    };
    const validateTermsStep = () => {
      if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
      return null;
    };
    
    let message: string | null = null;
    if (currentStep === 1) message = validateStep1();
    else if (currentStep === 2) message = validateStep2();
    else if (currentStep === 3) message = dbNeeded ? validateDbStep() : validateAuthStep();
    else if (currentStep === 4) message = dbNeeded ? validateAuthStep() : validateTermsStep();
    else if (currentStep === 5) message = dbNeeded ? validateTermsStep() : null;

    return message;
  };
  
  const isStepValid = (): boolean => {
    if (isFinalizingSetup) return false;
    return getValidationMessage() === null;
  };

  const handleNext = () => {
    const validationError = getValidationMessage();
    if (validationError) {
      toast({ title: "Error de Validación", description: validationError, variant: "destructive" });
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

    const finalAssistantConfig: AssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: assistantName,
        prompt: assistantPrompt,
        purposes: selectedPurposes,
        databaseId: newAssistantDbIdToLink,
        imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
    };
    
    const finalUserProfile: UserProfile = {
        isAuthenticated: true,
        phoneNumber: phoneNumber,
        password: password,
        assistants: [finalAssistantConfig],
        databases: newDbEntry ? [newDbEntry] : [],
        ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications,
        credits: 0, // New users start with 0 credits
    };
    
    // Save profile to API, which handles upsert
    try {
        const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userProfile: finalUserProfile }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create profile.");
        }
        
        // Update global state and redirect
        dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
        sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, newDbEntry || null)
            .catch(err => console.error("Error sending assistant created webhook:", err));

        toast({
            title: "¡Configuración Completa!",
            description: `${finalAssistantConfig.name} está listo.`,
        });

        onOpenChange(false); // Close dialog
        router.push('/dashboard'); // Redirect
    
    } catch (error: any) {
        toast({ title: "Error al Registrar", description: error.message, variant: "destructive"});
    } finally {
        setIsFinalizingSetup(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) return <Step1AssistantDetails />;
    if (currentStep === 2) return <Step2AssistantPrompt />;
    if (currentStep === 3) return dbNeeded ? <Step2DatabaseConfig /> : <Step4CreateCredentials />;
    if (currentStep === 4) return dbNeeded ? <Step4CreateCredentials /> : <Step5TermsAndConditions />;
    if (currentStep === 5) return dbNeeded ? <Step5TermsAndConditions /> : null;
    return null;
  };

  const handleDialogClose = (open: boolean) => {
    if (!isFinalizingSetup) {
        onOpenChange(open);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-sm" onInteractOutside={(e) => { if (isFinalizingSetup) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-brand-gradient">Crear un Nuevo Asistente</DialogTitle>
          <DialogDescription className="text-center">Sigue los pasos para configurar tu primer asistente inteligente.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <SetupProgressBar />
            <div className="min-h-[400px] relative">
            {isFinalizingSetup && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-md">
                <FaSpinner className="animate-spin h-10 w-10 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Finalizando configuración...</p>
                </div>
            )}
            <div className="p-1">
              {renderStepContent()}
            </div>
            </div>
            <div className="flex justify-between items-center pt-5 border-t">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isFinalizingSetup} className="transition-transform transform hover:scale-105">
                <FaArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>

            {currentStep < effectiveMaxSteps ? (
                <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid() || isFinalizingSetup}>
                Siguiente <FaArrowRight className="ml-2 h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleCompleteSetup} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid() || isFinalizingSetup}>
                {isFinalizingSetup && <FaSpinner className="animate-spin mr-2 h-4 w-4" />}
                Completar Configuración
                <FaArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssistantDialog;
