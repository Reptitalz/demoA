
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/auth/wizard-steps/Step1_AssistantDetails';
import Step2AssistantPrompt from '@/components/auth/wizard-steps/Step2_AssistantPrompt';
import Step2DatabaseConfig from '@/components/auth/wizard-steps/Step2_DatabaseConfig';
import Step5TermsAndConditions from '@/components/auth/wizard-steps/Step5_TermsAndConditions';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight, FaSpinner, FaGoogle } from 'react-icons/fa';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { signIn, useSession } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { UserPlus } from 'lucide-react';

interface AuthStepContentProps {
  onFinalize: (authProvider: 'google' | 'email', authData?: any) => Promise<void>;
  isProcessing: boolean;
}

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

const AuthStepContent = React.memo(({ onFinalize, isProcessing }: AuthStepContentProps) => {

  const handleGoogleAuth = () => {
    onFinalize('google');
  }

  return (
    <div className="animate-fadeIn space-y-6">
        <div className="text-center">
              <h3 className="text-xl font-semibold">Último Paso: Inicia Sesión para Guardar</h3>
              <p className="text-sm text-muted-foreground">
                Inicia sesión con Google para guardar tu asistente y acceder a tu panel.
              </p>
        </div>
        
        <Button
          onClick={handleGoogleAuth}
          disabled={isProcessing}
          variant="outline"
          className="w-full text-lg py-6"
          type="button"
         >
          {isProcessing ? <FaSpinner className="animate-spin h-5 w-5" /> : <FcGoogle className="mr-2 h-5 w-5" />}
          Continuar con Google
        </Button>

    </div>
  );
});
AuthStepContent.displayName = 'AuthStepContent';


interface RegisterAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterAssistantDialog = ({ isOpen, onOpenChange }: RegisterAssistantDialogProps) => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, acceptedTerms, assistantType } = state.wizard;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const dbNeeded = useMemo(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);
  
  const effectiveMaxSteps = useMemo(() => {
    // Step 1: Details, Step 2: Prompt, Step 3: (DB or Terms), Step 4: (Terms or Auth), Step 5: Auth
    let baseSteps = 1; // Details is now step 1
    baseSteps++; // Prompt
    if (dbNeeded) baseSteps++; // DB config
    baseSteps++; // Terms
    baseSteps++; // Auth
    return baseSteps;
  }, [dbNeeded]);


  const getValidationMessageForStep = useCallback((step: number): string | null => {
    switch (step) {
        case 1:
            if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
            return null;
        case 2:
            if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
            return null;
        case 3:
            if (dbNeeded) {
                if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
                if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
                if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/d/'))) return "Proporciona una URL válida de Hoja de Google.";
                if (databaseOption.type === "google_sheets" && !databaseOption.selectedSheetName) return "Por favor, selecciona una hoja del documento.";
            } else {
                if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
            }
            return null;
        case 4:
             if (dbNeeded) {
                 if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
             }
             return null;
        case 5:
             return null;
        default:
            return "Paso inválido";
    }
  }, [assistantName, assistantPrompt, dbNeeded, databaseOption, acceptedTerms]);
  
  const isStepValid = useMemo((): boolean => {
    if (isFinalizingSetup) return false;
    if (currentStep === effectiveMaxSteps) return true;

    return getValidationMessageForStep(currentStep) === null;
  }, [currentStep, getValidationMessageForStep, isFinalizingSetup, effectiveMaxSteps]);


  const handleNext = () => {
    const error = getValidationMessageForStep(currentStep);
    if (error) {
        toast({ title: "Error de Validación", description: error, variant: "destructive" });
        return;
    }
    
    let nextStep = currentStep + 1;

    // This logic is now more complex. It's better to manage step transitions carefully.
    // If we're on step 2 and no DB is needed, we jump to the 'terms' step, which is now 4.
    if (currentStep === 2 && !dbNeeded) {
        nextStep = 4; 
    }
    
    if (nextStep <= effectiveMaxSteps) {
        dispatch({ type: 'SET_WIZARD_STEP', payload: nextStep });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) { 
        let prevStep = currentStep - 1;
        // Correctly go back from Terms to Prompt if DB was skipped
        if (currentStep === 4 && !dbNeeded) {
            prevStep = 2; 
        }
        dispatch({ type: 'SET_WIZARD_STEP', payload: prevStep });
    } else {
        onOpenChange(false);
    }
  };
  
  const createOrUpdateProfileAndFinalize = useCallback(async (user: any) => {
      setIsFinalizingSetup(true);
      try {
        const userEmail = user.email;
        if (!userEmail) throw new Error("No se pudo obtener el email del usuario.");

        const isDesktopAssistant = assistantType === 'desktop';
        const userHasDesktopAssistant = state.userProfile.isAuthenticated && state.userProfile.assistants.some(a => a.type === 'desktop');
        const isFirstDesktopAssistantForUser = isDesktopAssistant && !userHasDesktopAssistant;
        
        const finalAssistantConfig: AssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName || (isDesktopAssistant ? "Mi Asistente de Escritorio" : "Mi Asistente de WhatsApp"),
            type: assistantType || 'desktop',
            prompt: assistantPrompt || "Eres un asistente amigable y servicial.",
            purposes: Array.from(selectedPurposes),
            databaseId: dbNeeded && databaseOption.type ? `db_${Date.now()}` : undefined,
            imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
            isActive: isDesktopAssistant && isFirstDesktopAssistantForUser,
            numberReady: isDesktopAssistant && isFirstDesktopAssistantForUser,
            messageCount: 0,
            monthlyMessageLimit: isDesktopAssistant && isFirstDesktopAssistantForUser ? 10000 : 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            chatPath: generateChatPath(assistantName),
            isFirstDesktopAssistant: isDesktopAssistant ? isFirstDesktopAssistantForUser : undefined,
            trialStartDate: isDesktopAssistant && isFirstDesktopAssistantForUser ? new Date().toISOString() : undefined,
        };

        const newDbEntry: DatabaseConfig | undefined = dbNeeded && databaseOption.type ? {
            id: finalAssistantConfig.databaseId!,
            name: databaseOption.name!,
            source: databaseOption.type!,
            details: databaseOption.name,
            accessUrl: databaseOption.type === 'google_sheets' ? databaseOption.accessUrl : undefined,
            sheetName: databaseOption.type === 'google_sheets' ? databaseOption.selectedSheetName : undefined,
            selectedColumns: databaseOption.selectedColumns,
            relevantColumnsDescription: databaseOption.relevantColumnsDescription,
        } : undefined;
          
        let finalProfile: Partial<UserProfile>;

        if (state.userProfile.isAuthenticated) {
            finalProfile = {
                assistants: [...state.userProfile.assistants, finalAssistantConfig],
                databases: newDbEntry ? [...(state.userProfile.databases || []), newDbEntry] : state.userProfile.databases,
            };
            dispatch({ type: 'UPDATE_USER_PROFILE', payload: finalProfile });
        } else {
             const finalProfileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
              firebaseUid: user.id,
              email: userEmail,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              authProvider: 'google',
              assistants: [finalAssistantConfig],
              databases: newDbEntry ? [newDbEntry] : [],
              credits: 0,
            };
            
            const response = await fetch('/api/create-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalProfileData),
            });

            const { userProfile: createdProfile, message } = await response.json();

            if (!response.ok && response.status !== 200) {
                throw new Error(message || "No se pudo crear el perfil de usuario.");
            }
            dispatch({ type: 'COMPLETE_SETUP', payload: createdProfile });
        }
          
        toast({ title: "¡Asistente Creado!", description: `Tu nuevo asistente está listo.` });
        onOpenChange(false);
        router.push('/dashboard');

      } catch (error: any) {
          console.error("Profile creation error:", error);
          toast({ title: "Error al crear asistente", description: error.message, variant: "destructive" });
      } finally {
        setIsFinalizingSetup(false);
      }
  }, [dbNeeded, databaseOption, assistantName, assistantPrompt, selectedPurposes, toast, router, onOpenChange, dispatch, state.userProfile, assistantType]);

  useEffect(() => {
    if (status === 'authenticated' && isOpen && currentStep === effectiveMaxSteps) {
      if (session?.user) {
        createOrUpdateProfileAndFinalize(session.user);
      }
    }
  }, [session, status, isOpen, currentStep, effectiveMaxSteps, createOrUpdateProfileAndFinalize]);
  
  const handleFinalize = useCallback(async (authProvider: 'google' | 'email') => {
    if (authProvider === 'google') {
       signIn('google', {
         callbackUrl: `/dashboard`
       });
    }
  }, []);

  const renderStepContent = () => {
    if (currentStep === effectiveMaxSteps && status === 'authenticated') {
      return (
         <div className="animate-fadeIn space-y-6 flex flex-col items-center justify-center h-full">
            <FaSpinner className="animate-spin h-10 w-10 text-primary" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">Guardando Asistente</h3>
              <p className="text-sm text-muted-foreground">
              Estamos añadiendo el nuevo asistente a tu cuenta.
              </p>
            </div>
        </div>
      );
    }
    
    const stepMap: Record<number, React.ReactNode> = {
        1: <Step1AssistantDetails />,
        2: <Step2AssistantPrompt />,
        3: dbNeeded ? <Step2DatabaseConfig /> : <Step5TermsAndConditions />,
        4: dbNeeded ? <Step5TermsAndConditions /> : <AuthStepContent onFinalize={handleFinalize} isProcessing={isFinalizingSetup} />,
        5: <AuthStepContent onFinalize={handleFinalize} isProcessing={isFinalizingSetup} />,
    };

    return stepMap[currentStep] || null;
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
          <DialogTitle className="text-2xl font-bold text-center text-brand-gradient flex items-center justify-center gap-2">
            <UserPlus /> Crear un Nuevo Asistente
          </DialogTitle>
          <DialogDescription className="text-center">
            Sigue los pasos para configurar tu nuevo asistente inteligente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 space-y-4">
            <SetupProgressBar />
            <div className="min-h-[400px] relative">
            {isFinalizingSetup && currentStep !== effectiveMaxSteps && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-md">
                <FaSpinner className="animate-spin h-10 w-10 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Finalizando...</p>
                </div>
            )}
            <div className="p-1">
              {renderStepContent()}
            </div>
            </div>
        </div>
        
        {currentStep < effectiveMaxSteps && (
          <div className="flex justify-between items-center p-6 border-t mt-auto bg-background/80 backdrop-blur-sm">
            <Button variant="outline" onClick={handlePrevious} disabled={isFinalizingSetup} className="transition-transform transform hover:scale-105">
                <FaArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>

            <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid || isFinalizingSetup}>
              Siguiente <FaArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssistantDialog;
