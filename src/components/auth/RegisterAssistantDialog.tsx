
"use client";

import React, { useState, useCallback, useMemo } from 'react';
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
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface RegisterAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RegisterAssistantDialog = ({ isOpen, onOpenChange }: RegisterAssistantDialogProps) => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, ownerPhoneNumberForNotifications, acceptedTerms } = state.wizard;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);
  // State for email/password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  const effectiveMaxSteps = useMemo(() => (dbNeeded ? 5 : 4), [dbNeeded]); // Added one step for auth

  const getValidationMessage = (): string | null => {
    switch (currentStep) {
        case 1:
            if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
            if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito.";
            if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu WhatsApp para notificaciones.";
            return null;
        case 2:
            if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
            return null;
        case 3:
            if (!dbNeeded) return getValidationMessageForStep(4); // Skip to terms
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
            if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
            if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Proporciona una URL válida de Hoja de Google.";
            if (databaseOption.type === "google_sheets" && !databaseOption.selectedSheetName) return "Por favor, selecciona una hoja del documento.";
            return null;
        case 4:
             if (!dbNeeded) return getValidationMessageForStep(5); // Skip to auth
            if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
            return null;
        case 5:
            if (dbNeeded && !acceptedTerms) return "Debes aceptar los términos y condiciones.";
            return null; // Auth step has its own validation
        default:
            return null;
    }
  };

  const getValidationMessageForStep = (step: number) => {
      // Helper function to avoid repetition
      switch(step) {
          case 4: return !acceptedTerms ? "Debes aceptar los términos y condiciones." : null;
          case 5: return null;
          default: return "Paso desconocido";
      }
  }
  
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
        let nextStep = currentStep + 1;
        // Skip DB config step if not needed
        if (nextStep === 3 && !dbNeeded) {
            nextStep++;
        }
        dispatch({ type: 'SET_WIZARD_STEP', payload: nextStep });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
        let prevStep = currentStep - 1;
        if (prevStep === 3 && !dbNeeded) {
            prevStep--;
        }
        dispatch({ type: 'SET_WIZARD_STEP', payload: prevStep });
    }
  };
  
  const createProfileAndFinalize = async (firebaseUser: any, authProvider: 'google' | 'email') => {
      let userFirstName = '', userLastName = '', userEmail = '';
      
      if (authProvider === 'google') {
        const [fName, ...lNameParts] = firebaseUser.displayName?.split(' ') || [];
        userFirstName = fName;
        userLastName = lNameParts.join(' ');
        userEmail = firebaseUser.email!;
      } else {
        userFirstName = firstName;
        userLastName = lastName;
        userEmail = email;
      }
      
      if (!firebaseUser.uid || !userEmail) {
          throw new Error("No se pudieron obtener los datos de autenticación.");
      }

      const newDbEntry: DatabaseConfig | undefined = (dbNeeded && databaseOption.type) ? {
            id: `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: databaseOption.name!,
            source: databaseOption.type!,
            details: databaseOption.name,
            accessUrl: databaseOption.type === 'google_sheets' ? databaseOption.accessUrl : undefined,
            sheetName: databaseOption.type === 'google_sheets' ? databaseOption.selectedSheetName : undefined,
            selectedColumns: databaseOption.selectedColumns,
            relevantColumnsDescription: databaseOption.relevantColumnsDescription,
        } : undefined;

        const finalAssistantConfig: AssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName,
            prompt: assistantPrompt,
            purposes: Array.from(selectedPurposes),
            databaseId: newDbEntry?.id,
            imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
            isActive: false,
            messageCount: 0,
            monthlyMessageLimit: 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        
        const finalProfileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
            firebaseUid: firebaseUser.uid,
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
            authProvider: 'google', // Hardcode to google for now
            assistants: [finalAssistantConfig],
            databases: newDbEntry ? [newDbEntry] : [],
            ownerPhoneNumberForNotifications: ownerPhoneNumberForNotifications,
            credits: 0,
        };

        const response = await fetch('/api/create-user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalProfileData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "No se pudo crear el perfil de usuario.");
        }

        const { userProfile: createdProfile } = await response.json();
        await sendAssistantCreatedWebhook(createdProfile, finalAssistantConfig, newDbEntry || null);
        dispatch({ type: 'COMPLETE_SETUP', payload: createdProfile });

        toast({ title: "¡Cuenta Creada!", description: `Bienvenido/a. Redirigiendo al dashboard...` });
        onOpenChange(false);
        router.push('/dashboard');
  }

  const handleAuth = async (provider: 'google' | 'email') => {
      setIsFinalizingSetup(true);
      const auth = getAuth(firebaseApp);
      try {
          if (provider === 'google') {
              const googleProvider = new GoogleAuthProvider();
              const result = await signInWithPopup(auth, googleProvider);
              await createProfileAndFinalize(result.user, 'google');
          } else {
              // Email/Password flow
              if (!email || !password || !firstName || !lastName) {
                  throw new Error("Por favor, completa todos los campos del formulario.");
              }
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              await createProfileAndFinalize(userCredential.user, 'email');
          }
      } catch(error: any) {
          console.error("Authentication/Registration Error:", error);
          let errorMessage = error.message;
          if (error.code === 'auth/email-already-in-use') {
              errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
          }
          toast({ title: "Error de Registro", description: errorMessage, variant: "destructive"});
      } finally {
          setIsFinalizingSetup(false);
      }
  };


  const renderStepContent = () => {
    let steps: Record<number, React.ReactNode> = {
        1: <Step1AssistantDetails />,
        2: <Step2AssistantPrompt />,
    };

    if (dbNeeded) {
        steps[3] = <Step2DatabaseConfig />;
        steps[4] = <Step5TermsAndConditions />;
        steps[5] = <AuthStep />;
    } else {
        steps[3] = <Step5TermsAndConditions />;
        steps[4] = <AuthStep />;
    }
    return steps[currentStep] || null;
  };
  
  const AuthStep = () => (
      <div className="animate-fadeIn space-y-6">
          <div className="text-center">
                <h3 className="text-xl font-semibold">Último Paso: Crea tu Cuenta</h3>
                <p className="text-sm text-muted-foreground">
                Crea una cuenta para guardar tu asistente y acceder a tu panel de control.
                </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="firstNameReg">Nombre</Label>
                  <Input id="firstNameReg" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Tu nombre" required />
              </div>
              <div>
                  <Label htmlFor="lastNameReg">Apellido</Label>
                  <Input id="lastNameReg" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Tu apellido" required />
              </div>
          </div>
          <div>
              <Label htmlFor="emailReg">Correo Electrónico</Label>
              <Input id="emailReg" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
          </div>
          <div>
              <Label htmlFor="passwordReg">Contraseña</Label>
              <Input id="passwordReg" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          </div>
          <Button onClick={() => handleAuth('email')} disabled={isFinalizingSetup} className="w-full">
            {isFinalizingSetup ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Crear Cuenta y Finalizar'}
          </Button>
          <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O</span>
              </div>
          </div>
          <Button onClick={() => handleAuth('google')} variant="outline" disabled={isFinalizingSetup} className="w-full flex items-center gap-2">
            {isFinalizingSetup ? <FaSpinner className="animate-spin h-5 w-5" /> : <FaGoogle />}
            Continuar con Google
          </Button>
      </div>
  );

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
          <DialogDescription className="text-center">
            Sigue los pasos para configurar tu primer asistente inteligente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 space-y-4">
            <SetupProgressBar />
            <div className="min-h-[400px] relative">
            {isFinalizingSetup && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-md">
                <FaSpinner className="animate-spin h-10 w-10 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Finalizando registro...</p>
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
                Siguiente <FaArrowRight className="ml-2 h-4 w-4" />
              </Button>
          ) : (
            <span /> // Placeholder to keep the layout consistent on the last step
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssistantDialog;
