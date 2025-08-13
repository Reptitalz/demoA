
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
import { useSession, signIn } from 'next-auth/react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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
  const { data: session } = useSession();
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');


  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  const effectiveMaxSteps = useMemo(() => (dbNeeded ? 4 : 3), [dbNeeded]);

  const getValidationMessage = (): string | null => {
    const validateStep0 = () => { // Validation for new email/pass fields
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Por favor, ingresa un correo electrónico válido.";
        if (!password.trim() || password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
        if (!firstName.trim()) return "Por favor, ingresa tu nombre.";
        if (!lastName.trim()) return "Por favor, ingresa tu apellido.";
        return null;
    }
    const validateStep1 = () => {
      if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
      if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito.";
      if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu WhatsApp para notificaciones.";
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
      if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/'))) return "Proporciona una URL válida de Hoja de Google.";
      if (databaseOption.type === "google_sheets" && !databaseOption.selectedSheetName) return "Por favor, selecciona una hoja del documento.";
      return null;
    };
    const validateTermsStep = () => {
      if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
      return null;
    };
    
    // If not logged in, we are on a "pre-step" 0
    if (!session) {
        return validateStep0();
    }
    
    let stepValidators;
    if (dbNeeded) { // 4-step flow
      stepValidators = [null, validateStep1, validateStep2, validateDbStep, validateTermsStep];
    } else { // 3-step flow
      stepValidators = [null, validateStep1, validateStep2, validateTermsStep];
    }
    
    return currentStep < stepValidators.length ? stepValidators[currentStep]!() : null;
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

    try {
        let firebaseUid, userEmail, userFirstName, userLastName, authProvider;

        if (session) {
            // Logged in with Google, but creating first assistant
            const user = session.user;
            if (!user?.email || !user?.id) throw new Error("La sesión de Google es inválida.");
            firebaseUid = user.id;
            userEmail = user.email;
            [userFirstName, ...userLastName] = user.name?.split(' ') || [firstName, lastName];
            authProvider = 'google';
        } else {
            // New user registering with email/password
            const auth = getAuth(firebaseApp);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            if (!firebaseUser) throw new Error("No se pudo crear el usuario en Firebase.");
            
            firebaseUid = firebaseUser.uid;
            userEmail = email;
            userFirstName = firstName;
            userLastName = lastName;
            authProvider = 'google'; // Keep it as google for now to match UserProfile type
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
            firebaseUid: firebaseUid,
            email: userEmail,
            firstName: userFirstName,
            lastName: userLastName,
            authProvider: 'google', // Hardcoded for now
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
        
        // After creating the user, sign them in to establish a session
        if (!session) {
            await signIn('credentials', { redirect: false, email, password });
        }
        
        dispatch({
            type: 'COMPLETE_SETUP',
            payload: createdProfile,
        });

        toast({
            title: "¡Cuenta Creada!",
            description: `Bienvenido/a. Redirigiendo al dashboard...`,
        });

        onOpenChange(false);
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Registration Error:", error);
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
        }
        toast({ title: "Error al Registrar", description: errorMessage, variant: "destructive"});
    } finally {
        setIsFinalizingSetup(false);
    }
  };

  const renderStepContent = () => {
    // If not logged in, show a "pre-step" to gather user info
    if (!session) {
      return (
        <div className="animate-fadeIn space-y-4">
            <div className="text-center">
                <h3 className="text-xl font-semibold">Crea tu Cuenta</h3>
                <p className="text-sm text-muted-foreground">
                Primero, necesitamos tus datos para crear la cuenta.
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
        </div>
      );
    }
  
    // If logged in, proceed with the normal wizard steps
    let steps;
    if (dbNeeded) { // 4-step flow
        steps = [null, <Step1AssistantDetails />, <Step2AssistantPrompt />, <Step2DatabaseConfig />, <Step5TermsAndConditions />];
    } else { // 3-step flow
        steps = [null, <Step1AssistantDetails />, <Step2AssistantPrompt />, <Step5TermsAndConditions />];
    }
    return currentStep < steps.length ? steps[currentStep] : null;
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!isFinalizingSetup) {
        onOpenChange(open);
    }
  }
  
  const isEmailPasswordFlow = !session;
  const showWizardSteps = !!session;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent 
        className="w-full h-full max-w-none sm:max-w-2xl sm:h-auto sm:max-h-[90vh] bg-background/95 backdrop-blur-sm flex flex-col p-0"
        onInteractOutside={(e) => { if (isFinalizingSetup) e.preventDefault(); }}>
        
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-center text-brand-gradient">Crear un Nuevo Asistente</DialogTitle>
          <DialogDescription className="text-center">
            {isEmailPasswordFlow 
                ? "Completa tus datos y luego configura tu primer asistente." 
                : "Sigue los pasos para configurar tu primer asistente inteligente."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 space-y-4">
            {showWizardSteps && <SetupProgressBar />}
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
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isFinalizingSetup || isEmailPasswordFlow} className="transition-transform transform hover:scale-105">
              <FaArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>

          {showWizardSteps && currentStep < effectiveMaxSteps ? (
              <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid() || isFinalizingSetup}>
                Siguiente <FaArrowRight className="ml-2 h-4 w-4" />
              </Button>
          ) : (
              <Button onClick={handleCompleteSetup} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid() || isFinalizingSetup}>
                {isFinalizingSetup && <FaSpinner className="animate-spin mr-2 h-4 w-4" />}
                {isEmailPasswordFlow ? "Crear Cuenta y Continuar" : "Completar Registro"}
                <FaArrowRight className="ml-2 h-4 w-4" />
              </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAssistantDialog;
