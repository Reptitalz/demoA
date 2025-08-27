
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step0AssistantType from './wizard-steps/Step0_AssistantType';
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
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { signIn, useSession } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { UserPlus } from 'lucide-react';

interface AuthStepContentProps {
  onFinalize: (authProvider: 'google' | 'email', authData: any) => Promise<void>;
  isProcessing: boolean;
}

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    // remove accents, swap ñ for n, etc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // remove invalid chars
    .replace(/[^a-z0-9 -]/g, '')
    // collapse whitespace and replace by -
    .replace(/\s+/g, '-')
    // collapse dashes
    .replace(/-+/g, '-');
  
  return `/chat/${slug}`;
}

// Separate component for the Auth Step to manage its own form state locally
const AuthStepContent = React.memo(({ onFinalize, isProcessing }: AuthStepContentProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const { toast } = useToast();

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast({ title: "Campos incompletos", description: "Por favor, completa todos los campos del formulario.", variant: "destructive"});
      return;
    }
    await onFinalize('email', { email, password, firstName, lastName });
  };
  
  const handleGoogleAuth = () => {
    onFinalize('google', {});
  }

  return (
    <div className="animate-fadeIn space-y-6">
        <div className="text-center">
              <h3 className="text-xl font-semibold">Último Paso: Crea tu Cuenta</h3>
              <p className="text-sm text-muted-foreground">
              Elige cómo quieres registrarte para guardar tu asistente y acceder a tu panel.
              </p>
        </div>
        
        <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
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
            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Crear Cuenta y Finalizar'}
            </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleAuth}
          disabled={isProcessing}
          variant="outline"
          className="w-full"
          type="button"
         >
          <FcGoogle className="mr-2 h-5 w-5" />
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
  const { state, dispatch } = useApp();
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, assistantPrompt, selectedPurposes, databaseOption, ownerPhoneNumberForNotifications, acceptedTerms, assistantType } = state.wizard;
  
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const dbNeeded = useMemo(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);
  
  const isWhatsappAssistant = useMemo(() => assistantType === 'whatsapp', [assistantType]);

  const effectiveMaxSteps = useMemo(() => {
    if (!isWhatsappAssistant) return 4; // Type -> Details -> Prompt -> Account
    return dbNeeded ? 6 : 5; // Type -> Details -> Prompt -> DB -> Terms -> Account
  }, [dbNeeded, isWhatsappAssistant]);


  const getValidationMessageForStep = useCallback((step: number): string | null => {
    switch (step) {
        case 1:
            if (!assistantType) return "Por favor, selecciona un tipo de asistente.";
            return null;
        case 2:
            if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
            if (isWhatsappAssistant) {
                if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito.";
                if (selectedPurposes.has('notify_owner') && !ownerPhoneNumberForNotifications?.trim()) return "Por favor, ingresa tu WhatsApp para notificaciones.";
            }
            return null;
        case 3:
            if (!assistantPrompt.trim()) return "Por favor, escribe un prompt para tu asistente.";
            return null;
        case 4:
            if (isWhatsappAssistant) {
                if (dbNeeded) {
                    if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
                    if (!databaseOption.name?.trim()) return `Por favor, proporciona un nombre para tu base de datos.`;
                    if (databaseOption.type === "google_sheets" && (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/d/'))) return "Proporciona una URL válida de Hoja de Google.";
                    if (databaseOption.type === "google_sheets" && !databaseOption.selectedSheetName) return "Por favor, selecciona una hoja del documento.";
                } else {
                    if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
                }
            } else { // Desktop
                if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
            }
            return null;
        case 5:
             if (isWhatsappAssistant) {
                if (dbNeeded) {
                    if (!acceptedTerms) return "Debes aceptar los términos y condiciones.";
                }
             }
             return null; // Auth step
        case 6:
             return null; // Auth step
        default:
            return "Paso inválido";
    }
  }, [assistantName, selectedPurposes, ownerPhoneNumberForNotifications, assistantPrompt, dbNeeded, databaseOption, acceptedTerms, assistantType, isWhatsappAssistant]);
  
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
    
    if (!isWhatsappAssistant && currentStep === 3) {
      nextStep = 4; // Skip to Auth for desktop
    }
    if (isWhatsappAssistant && currentStep === 3 && !dbNeeded) {
        nextStep = 5; // Skip DB config if not needed
    }
    
    if (nextStep <= effectiveMaxSteps) {
        dispatch({ type: 'SET_WIZARD_STEP', payload: nextStep });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
        let prevStep = currentStep - 1;
        if (!isWhatsappAssistant && currentStep === 4) {
          prevStep = 3; // Go back to prompt from auth
        }
        if (isWhatsappAssistant && currentStep === 5 && !dbNeeded) {
            prevStep = 3; // Go back to prompt from terms, skipping db
        }
        dispatch({ type: 'SET_WIZARD_STEP', payload: prevStep });
    }
  };
  
  const createProfileAndFinalize = useCallback(async (firebaseUser: any, authProvider: 'google' | 'email', formData?: any) => {
      setIsFinalizingSetup(true);
      try {
        const userEmail = firebaseUser.email;
        const uid = firebaseUser.uid;
        
        const userFirstName = authProvider === 'email' ? formData.firstName : (firebaseUser.name?.split(' ')[0] || '');
        const userLastName = authProvider === 'email' ? formData.lastName : (firebaseUser.name?.split(' ').slice(1).join(' ') || '');
        
        if (!uid || !userEmail) {
            throw new Error("No se pudieron obtener los datos de autenticación.");
        }
        
        const isDesktopAssistant = assistantType === 'desktop';

        const finalAssistantConfig: AssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName || (isDesktopAssistant ? "Mi Asistente de Escritorio" : "Mi Asistente de WhatsApp"),
            type: assistantType || 'desktop',
            prompt: assistantPrompt || "Eres un asistente amigable y servicial.",
            purposes: Array.from(selectedPurposes),
            databaseId: dbNeeded && databaseOption.type ? `db_${Date.now()}` : undefined,
            imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
            isActive: isDesktopAssistant,
            numberReady: isDesktopAssistant,
            messageCount: 0,
            monthlyMessageLimit: isDesktopAssistant ? 1000 : 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            chatPath: isDesktopAssistant ? generateChatPath(assistantName) : undefined,
            isFirstDesktopAssistant: isDesktopAssistant,
            trialStartDate: isDesktopAssistant ? new Date().toISOString() : undefined,
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
          
          const finalProfileData: Omit<UserProfile, '_id' | 'isAuthenticated'> = {
              firebaseUid: uid,
              email: userEmail,
              firstName: userFirstName,
              lastName: userLastName,
              authProvider,
              assistants: [finalAssistantConfig],
              databases: newDbEntry ? [newDbEntry] : [],
              credits: isDesktopAssistant ? 1 : 0,
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
          
          if (response.status === 201) {
            await sendAssistantCreatedWebhook(createdProfile, finalAssistantConfig, newDbEntry || null);
          }

          if (authProvider === 'email') {
             await signIn('credentials', {
                redirect: false,
                email: userEmail,
                password: formData.password,
                userType: 'user'
            });
          }
          
          dispatch({ type: 'COMPLETE_SETUP', payload: createdProfile });
          toast({ title: "¡Cuenta Creada!", description: `Bienvenido/a. Redirigiendo al dashboard...` });
          onOpenChange(false);
          router.push('/dashboard/assistants');

      } catch (error: any) {
          console.error("Profile creation error:", error);
          toast({ title: "Error al crear perfil", description: error.message, variant: "destructive" });
      } finally {
        setIsFinalizingSetup(false);
      }
  }, [dbNeeded, databaseOption, assistantName, assistantPrompt, selectedPurposes, toast, router, onOpenChange, dispatch, assistantType]);

  useEffect(() => {
    if (session?.user && isOpen && !state.userProfile.isAuthenticated && currentStep >= effectiveMaxSteps) {
        const firebaseUser = {
            uid: session.user.id,
            email: session.user.email,
            name: session.user.name,
        };
        createProfileAndFinalize(firebaseUser, 'google');
    }
  }, [session, isOpen, state.userProfile.isAuthenticated, currentStep, effectiveMaxSteps, createProfileAndFinalize]);
  
  const handleFinalize = useCallback(async (authProvider: 'google' | 'email', authData: any) => {
    if (authProvider === 'email') {
      setIsFinalizingSetup(true);
      const auth = getAuth(firebaseApp);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
        await createProfileAndFinalize(userCredential.user, 'email', authData);
      } catch (error: any) {
          console.error("Authentication/Registration Error:", error);
          let errorMessage = "Ocurrió un error inesperado.";
          if (error.code === 'auth/email-already-in-use') {
              errorMessage = "Este correo electrónico ya está registrado. Por favor, inicia sesión.";
          } else if (error.message) {
              errorMessage = error.message;
          }
          toast({ title: "Error de Registro", description: errorMessage, variant: "destructive"});
          setIsFinalizingSetup(false);
      }
    } else { // Google
       signIn('google', {
         callbackUrl: `/dashboard?newUserFlow=${state.wizard.assistantType}`
       });
    }
  }, [createProfileAndFinalize, toast, state.wizard.assistantType]);

  const renderStepContent = () => {
    if (currentStep === effectiveMaxSteps) {
        return <AuthStepContent onFinalize={handleFinalize} isProcessing={isFinalizingSetup} />;
    }

    switch(currentStep) {
        case 1: return <Step0AssistantType />;
        case 2: return <Step1AssistantDetails />;
        case 3: return <Step2AssistantPrompt />;
        case 4:
            if (isWhatsappAssistant) {
                return dbNeeded ? <Step2DatabaseConfig /> : <Step5TermsAndConditions />;
            }
            return <Step5TermsAndConditions />; // Desktop flow
        case 5: 
            return isWhatsappAssistant ? <Step5TermsAndConditions /> : null;
        default: return null;
    }
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
              <Button onClick={handleNext} className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105" disabled={!isStepValid || isFinalizingSetup}>
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
