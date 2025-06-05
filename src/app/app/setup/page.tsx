
"use client";

import { useState, useEffect } from 'react';
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
import { FaArrowLeft, FaArrowRight, FaHome } from 'react-icons/fa';
import { LogIn, UserPlus } from 'lucide-react';
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, MAX_WIZARD_STEPS, DEFAULT_FREE_PLAN_PHONE_NUMBER, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan, customPhoneNumber, isReconfiguring, editingAssistantId } = state.wizard;
  
  const [userHasMadeInitialChoice, setUserHasMadeInitialChoice] = useState(false);

  useEffect(() => {
    // If user is authenticated or reconfiguring, they've effectively made an initial choice or bypassed it.
    if (state.userProfile.isAuthenticated || isReconfiguring) {
      setUserHasMadeInitialChoice(true);
    }
  }, [state.userProfile.isAuthenticated, isReconfiguring]);

  const effectiveMaxSteps = isReconfiguring ? 3 : MAX_WIZARD_STEPS;

  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep;

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          break;
        case 2:
          if (!databaseOption.type && selectedPurposes.size > 0 && (selectedPurposes.has('import_db_excel') || selectedPurposes.has('import_db_google_sheets') || selectedPurposes.has('create_smart_db'))) {
            return "Por favor, selecciona una opción de base de datos.";
          }
          if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && !databaseOption.name?.trim()) {
              return `Por favor, proporciona un nombre/enlace para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
          }
          if (databaseOption.type === "excel" && !databaseOption.file && !databaseOption.name) {
            const assistantBeingEdited = editingAssistantId ? state.userProfile.assistants.find(a => a.id === editingAssistantId) : null;
            const existingDb = assistantBeingEdited?.databaseId ? state.userProfile.databases.find(db => db.id === assistantBeingEdited.databaseId) : null;
            if(!(existingDb && existingDb.source === 'excel')) {
                 return "Por favor, sube un archivo de Excel.";
            }
          }
          break;
        case 3:
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    } else { // Standard setup flow
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPlan === 'business_270' && !isReconfiguring && !customPhoneNumber?.trim()) {
            return "Por favor, ingresa un número de teléfono para el asistente (Plan de Negocios).";
          }
          break;
        case 2:
          if (!databaseOption.type && selectedPurposes.size > 0 && (selectedPurposes.has('import_db_excel') || selectedPurposes.has('import_db_google_sheets') || selectedPurposes.has('create_smart_db'))) {
             return "Por favor, selecciona una opción de base de datos.";
          }
          if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && !databaseOption.name?.trim()) {
              return `Por favor, proporciona un nombre/enlace para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
          }
          if (databaseOption.type === "excel" && !databaseOption.file) return "Por favor, sube un archivo de Excel.";
          break;
        case 3:
          if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
          break;
        case 4:
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    }
    return "Por favor, completa el paso actual.";
  };

  const isStepValid = (): boolean => {
    const currentValidationStep = currentStep;
    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: return assistantName.trim() !== '' && selectedPurposes.size > 0;
        case 2:
          if (!databaseOption.type) {
            return true;
          }
          if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
          if (databaseOption.type === "excel") {
            return !!databaseOption.file || (!!databaseOption.name && !databaseOption.file);
          }
          return true;
        case 3: return !!selectedPlan;
        default: return false;
      }
    } else { // Standard setup flow
      switch (currentValidationStep) {
        case 1:
          const baseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          if (selectedPlan === 'business_270' && !isReconfiguring) {
            return baseValid && !!customPhoneNumber?.trim();
          }
          return baseValid;
        case 2:
          if (!databaseOption.type) {
            return !Array.from(selectedPurposes).some(p => ['import_db_excel', 'import_db_google_sheets', 'create_smart_db'].includes(p as string));
          }
          if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
          if (databaseOption.type === "excel") return !!databaseOption.file;
          return true;
        case 3: return !!authMethod;
        case 4: return !!selectedPlan;
        default: return false;
      }
    }
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
    dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
  };

  const handleCompleteSetup = async () => {
    if (!isStepValid()) {
      toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
      return;
    }

    let finalAssistantConfig: AssistantConfig;
    let updatedAssistantsArray: AssistantConfig[];
    const newDbEntries: DatabaseConfig[] = [];
    let newAssistantDbIdToLink: string | undefined = undefined;
    let assistantPhoneNumber: string | undefined;
    let assistantImageUrl: string = DEFAULT_ASSISTANT_IMAGE_URL;
    let finalAssistantName = assistantName; // Use wizard name by default

    if (editingAssistantId) { // Reconfiguring
        const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
        assistantImageUrl = assistantToUpdate.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL;
        // Logic for phone number when reconfiguring
        if (selectedPlan === 'free') {
            assistantPhoneNumber = DEFAULT_FREE_PLAN_PHONE_NUMBER;
        } else if (selectedPlan === 'test_plan') {
            assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`; // Should ideally be preserved or derived if already exists
        } else if (assistantToUpdate.phoneLinked === DEFAULT_FREE_PLAN_PHONE_NUMBER && selectedPlan !== 'free' && selectedPlan !== 'test_plan') {
            // User is upgrading from free, and the number was the default free one. 
            // The new plan (premium/business) implies a new Vonage number will be provisioned at the account level or a custom one used.
            // For premium, the assistant will implicitly use the account's Vonage number.
            // For business, if no custom number is entered *for this specific assistant during reconfig*, it might also use account's number.
            // This logic might need to be more specific if assistant-level custom numbers can be set during reconfig of business plan.
            assistantPhoneNumber = undefined; // Let it pick up account's new number or stay undefined if business plan has its own logic.
        } else if (selectedPlan === 'business_270') {
            // If it's business plan, and there was a custom phone number input in wizard step 1 for reconfig (if implemented), use it.
            // Otherwise, preserve existing phoneLinked if it's not the default free one.
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        } else { // For other paid plans (e.g., premium)
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        }
    } else { // New assistant
        assistantImageUrl = DEFAULT_ASSISTANT_IMAGE_URL;
        if (selectedPlan === 'business_270') {
            assistantPhoneNumber = customPhoneNumber || undefined; // User entered in Step 1 for new Business assistant
        } else if (selectedPlan === 'free') {
            assistantPhoneNumber = DEFAULT_FREE_PLAN_PHONE_NUMBER;
            if (state.userProfile.assistants.length === 0) { // If it's the first assistant on a free plan
                finalAssistantName = "Hey Asistente";
            }
        } else if (selectedPlan === 'test_plan') {
            assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            if (state.userProfile.assistants.length === 0) { // If it's the first assistant on a test_plan
                finalAssistantName = "Hey Asistente";
            }
        } else { // For new premium_179 assistants, phone number is typically the account's Vonage number.
                 // This will be provisioned by Stripe webhook / userSubscriptionService if not already present.
                 // So, leave it undefined here, it will inherit account's main number.
            assistantPhoneNumber = undefined;
        }
    }


    if (databaseOption.type) {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newDbEntries.push({
        id: dbId,
        name: databaseOption.name || (databaseOption.file?.name) || `Mi ${databaseOption.type.replace('_', ' ')}`,
        source: databaseOption.type,
        details: databaseOption.type === 'excel' && databaseOption.file ? databaseOption.file.name : databaseOption.name,
      });
      newAssistantDbIdToLink = dbId;
    }

    if (editingAssistantId) {
      const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
      finalAssistantConfig = {
        ...assistantToUpdate,
        name: finalAssistantName, // Use finalAssistantName
        purposes: selectedPurposes,
        phoneLinked: assistantPhoneNumber,
        databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink : assistantToUpdate.databaseId,
        imageUrl: assistantImageUrl,
      };
      updatedAssistantsArray = state.userProfile.assistants.map(asst =>
        asst.id === editingAssistantId ? finalAssistantConfig : asst
      );
    } else {
      finalAssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: finalAssistantName, // Use finalAssistantName
        purposes: selectedPurposes,
        phoneLinked: assistantPhoneNumber,
        databaseId: newAssistantDbIdToLink,
        imageUrl: assistantImageUrl,
      };
      updatedAssistantsArray = [...state.userProfile.assistants, finalAssistantConfig];
    }

    let updatedDatabasesArray = [...state.userProfile.databases, ...newDbEntries];
    if (editingAssistantId && newAssistantDbIdToLink) {
        const oldAssistantVersion = state.userProfile.assistants.find(a => a.id === editingAssistantId);
        const oldDbId = oldAssistantVersion?.databaseId;
        if (oldDbId && oldDbId !== newAssistantDbIdToLink) {
            const isOldDbUsedByOthers = state.userProfile.assistants.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers && !newDbEntries.find(ndb => ndb.id === oldDbId)) {
                updatedDatabasesArray = updatedDatabasesArray.filter(db => db.id !== oldDbId);
            }
        }
    }

    const finalUserProfile: UserProfile = {
      ...state.userProfile,
      currentPlan: selectedPlan,
      assistants: updatedAssistantsArray,
      databases: updatedDatabasesArray,
    };

    const assistantsForLog = finalUserProfile.assistants.map(asst => ({
      ...asst,
      purposes: Array.from(asst.purposes)
    }));

    if (editingAssistantId) {
      console.log("Asistente Reconfigurado. Configuración de todos los asistentes:", JSON.stringify(assistantsForLog, null, 2));
    } else {
      console.log("Nuevo Asistente Creado. Configuración de todos los asistentes:", JSON.stringify(assistantsForLog, null, 2));
    }

    if (!editingAssistantId && finalAssistantConfig) {
      const assistantDb = newAssistantDbIdToLink
        ? updatedDatabasesArray.find(db => db.id === newAssistantDbIdToLink)
        : null;
      await sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, assistantDb || null);
    }


    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    toast({
      title: isReconfiguring ? "¡Asistente Actualizado!" : "¡Configuración Completa!",
      description: `${finalAssistantConfig.name} ${isReconfiguring ? 'ha sido actualizado.' : `está listo.`}`,
      action: (
        <Button variant="ghost" size="sm" onClick={() => router.push('/app/dashboard')}>
          Ir al Panel
        </Button>
      ),
    });
    router.push('/app/dashboard');
  };

  const renderStepContent = () => {
    if (isReconfiguring) {
      switch (currentStep) {
        case 1: return <Step1AssistantDetails />;
        case 2: return <Step2DatabaseConfig />;
        case 3: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
        default: return null;
      }
    } else {
      switch (currentStep) {
        case 1: return <Step1AssistantDetails />;
        case 2: return <Step2DatabaseConfig />;
        case 3: return <Step3Authentication />;
        case 4: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
        default: return null;
      }
    }
  };

  // Show initial choice card if user is not authenticated, not reconfiguring, and hasn't made a choice
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
              variant="outline"
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={() => {
                setUserHasMadeInitialChoice(true);
                dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); // Go to Authentication step
                toast({ title: "Iniciar Sesión", description: "Por favor, elige un método de autenticación."});
              }}
            >
              <LogIn className="mr-3 h-5 w-5 text-primary" />
              Iniciar sesión (si ya tienes cuenta)
            </Button>
            <Button
              size="lg"
              className="w-full justify-start text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90"
              onClick={() => {
                setUserHasMadeInitialChoice(true);
                dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); // Go to Assistant Details step
                toast({ title: "Nuevo Asistente", description: "Comencemos a definir tu asistente."});
              }}
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Define tu Asistente
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
        <div className="min-h-[260px] sm:min-h-[280px]">
         {renderStepContent()}
        </div>
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-1.5">
            {state.isSetupComplete && !isReconfiguring && ( // Show only if setup is complete and not reconfiguring
              <Button
                variant="outline"
                onClick={() => {
                  dispatch({ type: 'RESET_WIZARD' }); // Ensure wizard is reset before going to dashboard
                  router.push('/app/dashboard');
                }}
                className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
              >
                <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
            >
              <FaArrowLeft className="mr-1 h-3 w-3" /> Anterior
            </Button>
          </div>

          {currentStep < effectiveMaxSteps && (
            <Button
              onClick={handleNext}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid()}
            >
              Siguiente <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
          {currentStep === effectiveMaxSteps && (
             <Button
              onClick={handleCompleteSetup}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid()}
            >
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"} <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;

