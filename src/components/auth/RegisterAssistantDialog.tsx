
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/auth/wizard-steps/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/auth/wizard-steps/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/auth/wizard-steps/Step2_DatabaseConfig';
import Step4CreateCredentials from '@/components/auth/wizard-steps/Step4_CreateCredentials';
import Step5Verification from '@/components/auth/wizard-steps/Step5_Verification';
import Step5TermsAndConditions from '@/components/auth/wizard-steps/Step5_TermsAndConditions';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight, FaSpinner } from 'react-icons/fa';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { sendVerificationCodeWebhook } from '@/services/verificationWebhookService';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface RegisterAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterAssistantDialog = ({ isOpen, onOpenChange }: RegisterAssistantDialogProps) => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, ownerPhoneNumberForNotifications, acceptedTerms, phoneNumber, password, confirmPassword, verificationCode } = state.wizard;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [verificationKey, setVerificationKey] = useState("");

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  const effectiveMaxSteps = useMemo(() => (dbNeeded ? 6 : 5), [dbNeeded]);

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
    const validateVerificationStep = () => {
      if (!verificationCode?.trim()) return "Por favor, ingresa el código de verificación.";
      if (verificationCode !== verificationKey) return "El código de verificación es incorrecto.";
      return null;
    }
    const validateTermsStep = () => {
      if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
      return null;
    };
    
    // Determine which conceptual step we are on to call the right validator
    if (currentStep === 1) return validateStep1();
    if (currentStep === 2) return validateStep2();
    if (dbNeeded) { // 6-step flow
        if (currentStep === 3) return validateDbStep();
        if (currentStep === 4) return validateAuthStep();
        if (currentStep === 5) return validateVerificationStep();
        if (currentStep === 6) return validateTermsStep();
    } else { // 5-step flow
        if (currentStep === 3) return validateAuthStep();
        if (currentStep === 4) return validateVerificationStep();
        if (currentStep === 5) return validateTermsStep();
    }
    
    return null;
  };
  
  const isStepValid = (): boolean => {
    if (isFinalizingSetup) return false;
    return getValidationMessage() === null;
  };

  const handleNext = async () => {
    const validationError = getValidationMessage();
    if (validationError) {
      toast({ title: "Error de Validación", description: validationError, variant: "destructive" });
      return;
    }

    // This is the step right before verification
    const verificationTriggerStep = dbNeeded ? 4 : 3;

    if (currentStep === verificationTriggerStep && !webhookSent) {
        setIsFinalizingSetup(true); // Show spinner while sending webhook
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setVerificationKey(code);
        try {
            await sendVerificationCodeWebhook(phoneNumber!, code);
            toast({ title: "Código Enviado", description: "Hemos enviado el código de verificación a tu webhook." });
            setWebhookSent(true);
            dispatch({ type: 'NEXT_WIZARD_STEP' });
        } catch (error) {
            toast({ title: "Error de Webhook", description: "No se pudo enviar el código de verificación.", variant: "destructive" });
        } finally {
            setIsFinalizingSetup(false);
        }
    } else if (currentStep < effectiveMaxSteps) {
        dispatch({ type: 'NEXT_WIZARD_STEP' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      if (webhookSent) {
        setWebhookSent(false); // Allow resending if user goes back
      }
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
    
    const userProfileForApi: Omit<UserProfile, 'password'> & { password?: string } = {
        isAuthenticated: true,
        email: undefined, // Email is not collected in this flow.
        phoneNumber: phoneNumber,
        password: password,
        assistants: [finalAssistantConfig],
        databases: newDbEntry ? [newDbEntry] : [],
        ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications,
        credits: 0,
        pushSubscriptions: [],
    };
    
    try {
        const response = await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userProfile: userProfileForApi }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Failed to create profile.");
        }
        
        const finalUserProfileForState: UserProfile = {
            ...userProfileForApi,
            password: '', 
        }
        
        dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfileForState });
        
        sendAssistantCreatedWebhook(finalUserProfileForState, finalAssistantConfig, newDbEntry || null)
            .catch(err => console.error("Error sending assistant created webhook:", err));

        toast({
            title: "¡Configuración Completa!",
            description: `${finalAssistantConfig.name} está listo.`,
        });

        onOpenChange(false);
        router.push('/dashboard');
    
    } catch (error: any) {
        toast({ title: "Error al Registrar", description: error.message, variant: "destructive"});
    } finally {
        setIsFinalizingSetup(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) return <Step1AssistantDetails />;
    if (currentStep === 2) return <Step2AssistantPrompt />;
    if (dbNeeded) { // 6-step flow
        if (currentStep === 3) return <Step2DatabaseConfig />;
        if (currentStep === 4) return <Step4CreateCredentials />;
        if (currentStep === 5) return <Step5Verification verificationKey={verificationKey} />;
        if (currentStep === 6) return <Step5TermsAndConditions />;
    } else { // 5-step flow
        if (currentStep === 3) return <Step4CreateCredentials />;
        if (currentStep === 4) return <Step5Verification verificationKey={verificationKey} />;
        if (currentStep === 5) return <Step5TermsAndConditions />;
    }
    return null;
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!isFinalizingSetup) {
        onOpenChange(open);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent 
        className="w-full h-full max-w-none sm:max-w-2xl sm:h-auto sm:max-h-[90vh] bg-background/95 backdrop-blur-sm flex flex-col p-0"
        onInteractOutside={(e) => { if (isFinalizingSetup) e.preventDefault(); }}>
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-brand-gradient">Crear un Nuevo Asistente</DialogTitle>
          <DialogDescription className="text-center">Sigue los pasos para configurar tu primer asistente inteligente.</DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 space-y-4">
            <SetupProgressBar />
            <div className="min-h-[400px] relative">
            {isFinalizingSetup && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-md">
                <FaSpinner className="animate-spin h-10 w-10 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Enviando información...</p>
                </div>
            )}
            <div className="p-1">
              {renderStepContent()}
            </div>
            </div>
        </div>
        
        <div className="flex justify-between items-center p-6 border-t mt-auto bg-background/80 backdrop-blur-sm">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isFinalizingSetup} className="transition-transform transform hover:scale-105">
              <FaArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>

          {currentStep < effectiveMaxSteps ? (
              <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid() || isFinalizingSetup}>
                {isFinalizingSetup ? <FaSpinner className="animate-spin mr-2 h-4 w-4" /> : null}
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
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssistantDialog;
