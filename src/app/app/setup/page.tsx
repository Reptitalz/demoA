
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
    if (state.userProfile.isAuthenticated || isReconfiguring) {
      setUserHasMadeInitialChoice(true);
    }
  }, [state.userProfile.isAuthenticated, isReconfiguring]);

  const needsDatabaseConfiguration = () => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  };

  const effectiveMaxSteps = isReconfiguring 
    ? (needsDatabaseConfiguration() ? 3 : 2) // Step 1 (Details), Step 2 (DB if needed), Step 3 (Plan)
    : (needsDatabaseConfiguration() ? MAX_WIZARD_STEPS : MAX_WIZARD_STEPS - 1); // Step 1 (Details), Step 2 (DB if needed), Step 3 (Auth), Step 4 (Plan)


  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep;

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          break;
        case 2: // This is DB config if needed, otherwise it's Plan selection
          if (needsDatabaseConfiguration()) { // If we are on DB config step
            if (!databaseOption.type && (selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db'))) {
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
          } else { // If DB step was skipped, this is Plan selection (Step 2 for reconfig without DB)
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 3: // This is Plan selection if DB was configured (Step 3 for reconfig with DB)
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
        case 2: // This is DB config if needed, otherwise it's Auth
           if (needsDatabaseConfiguration()) { // If we are on DB config step
            if (!databaseOption.type && (selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db'))) {
               return "Por favor, selecciona una opción de base de datos.";
            }
            if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && !databaseOption.name?.trim()) {
                return `Por favor, proporciona un nombre/enlace para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
            }
            if (databaseOption.type === "excel" && !databaseOption.file) return "Por favor, sube un archivo de Excel.";
           } else { // If DB step was skipped, this is Auth step (Step 2 for standard without DB)
             if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
           }
          break;
        case 3: // This is Auth if DB was configured, otherwise it's Plan
          if (needsDatabaseConfiguration()) { // If DB was configured, this is Auth (Step 3 for standard with DB)
            if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
          } else { // If DB was skipped, this is Plan (Step 3 for standard without DB)
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 4: // This is Plan selection if DB was configured (Step 4 for standard with DB)
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
        case 2: // DB Config (if needed) OR Plan Selection
          if (needsDatabaseConfiguration()) { // Validating DB Config
            if (!databaseOption.type) return !Array.from(selectedPurposes).some(p => ['import_spreadsheet', 'create_smart_db'].includes(p as string));
            if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
            if (databaseOption.type === "excel") return !!databaseOption.file || (!!databaseOption.name && !databaseOption.file);
            return true;
          } else { // Validating Plan Selection (as Step 2)
            return !!selectedPlan;
          }
        case 3: // Plan Selection (if DB was configured)
          return !!selectedPlan;
        default: return false;
      }
    } else { // Standard setup flow
      switch (currentValidationStep) {
        case 1:
          const baseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          if (selectedPlan === 'business_270' && !isReconfiguring) return baseValid && !!customPhoneNumber?.trim();
          return baseValid;
        case 2: // DB Config (if needed) OR Auth
          if (needsDatabaseConfiguration()) { // Validating DB Config
            if (!databaseOption.type) return !Array.from(selectedPurposes).some(p => ['import_spreadsheet', 'create_smart_db'].includes(p as string));
            if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
            if (databaseOption.type === "excel") return !!databaseOption.file;
            return true;
          } else { // Validating Auth (as Step 2)
            return !!authMethod;
          }
        case 3: // Auth (if DB was configured) OR Plan
           if (needsDatabaseConfiguration()) { // Validating Auth (as Step 3)
            return !!authMethod;
           } else { // Validating Plan (as Step 3)
            return !!selectedPlan;
           }
        case 4: // Plan Selection (if DB was configured)
          return !!selectedPlan;
        default: return false;
      }
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 1) { // Moving from Step 1 (Assistant Details)
        if (!needsDatabaseConfiguration()) {
          // Skip Step 2 (Database Config)
          if (isReconfiguring) {
            dispatch({ type: 'SET_WIZARD_STEP', payload: 2 }); // Go to Plan (which is effectively step 2 in this path)
          } else {
            dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); // Go to Auth
          }
        } else {
          dispatch({ type: 'NEXT_WIZARD_STEP' }); // Go to Step 2 (Database Config)
        }
      } else if (currentStep === 2 && !needsDatabaseConfiguration() && !isReconfiguring) { // Moving from Step 2 (Auth, because DB was skipped)
         dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); // Go to Plan
      }
      else if (currentStep < effectiveMaxSteps) {
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
    if (currentStep === 3 && !needsDatabaseConfiguration() && !isReconfiguring) { // Coming back from Plan (Step 3), DB was skipped
      dispatch({ type: 'SET_WIZARD_STEP', payload: 2 }); // Go to Auth (Step 2 in this path)
    } else if (currentStep === 2 && !needsDatabaseConfiguration() && isReconfiguring) { // Coming back from Plan (Step 2 in reconfig), DB was skipped
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); // Go to Assistant Details
    }
    else if ((currentStep === 3 && !isReconfiguring) || (currentStep === 2 && isReconfiguring)) { // Trying to go back from Auth (standard) or Plan (reconfig)
      if (!needsDatabaseConfiguration()) {
        // If DB config was skipped, go directly to Step 1
        dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
      } else {
        // Otherwise, go to previous step (which is DB config)
        dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
      }
    } else if (currentStep > 1) {
      dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
    }
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
    let finalAssistantName = assistantName; 

    if (editingAssistantId) { 
        const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
        assistantImageUrl = assistantToUpdate.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL;
        if (selectedPlan === 'free') {
            assistantPhoneNumber = DEFAULT_FREE_PLAN_PHONE_NUMBER;
        } else if (selectedPlan === 'test_plan') {
            assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`; 
        } else if (assistantToUpdate.phoneLinked === DEFAULT_FREE_PLAN_PHONE_NUMBER && selectedPlan !== 'free' && selectedPlan !== 'test_plan') {
            assistantPhoneNumber = undefined; 
        } else if (selectedPlan === 'business_270') {
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        } else { 
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        }
    } else { 
        assistantImageUrl = DEFAULT_ASSISTANT_IMAGE_URL;
        if (selectedPlan === 'business_270') {
            assistantPhoneNumber = customPhoneNumber || undefined; 
        } else if (selectedPlan === 'free') {
            assistantPhoneNumber = DEFAULT_FREE_PLAN_PHONE_NUMBER;
            if (state.userProfile.assistants.length === 0) { 
                finalAssistantName = "Hey Asistente";
            }
        } else if (selectedPlan === 'test_plan') {
            assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            if (state.userProfile.assistants.length === 0) { 
                finalAssistantName = "Hey Asistente";
            }
        } else { 
            assistantPhoneNumber = undefined;
        }
    }


    if (needsDatabaseConfiguration() && databaseOption.type) {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newDbEntries.push({
        id: dbId,
        name: databaseOption.name || (databaseOption.file?.name) || `Mi ${databaseOption.type.replace('_', ' ')}`,
        source: databaseOption.type,
        details: databaseOption.type === 'excel' && databaseOption.file ? databaseOption.file.name : databaseOption.name,
      });
      newAssistantDbIdToLink = dbId;
    } else if (!needsDatabaseConfiguration()) {
        // Ensure databaseOption is reset if DB config was skipped or not needed
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: null, name: '', file: null } });
    }


    if (editingAssistantId) {
      const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
      finalAssistantConfig = {
        ...assistantToUpdate,
        name: finalAssistantName, 
        purposes: selectedPurposes,
        phoneLinked: assistantPhoneNumber,
        databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink : (needsDatabaseConfiguration() ? assistantToUpdate.databaseId : undefined),
        imageUrl: assistantImageUrl,
      };
      updatedAssistantsArray = state.userProfile.assistants.map(asst =>
        asst.id === editingAssistantId ? finalAssistantConfig : asst
      );
    } else {
      finalAssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: finalAssistantName, 
        purposes: selectedPurposes,
        phoneLinked: assistantPhoneNumber,
        databaseId: newAssistantDbIdToLink,
        imageUrl: assistantImageUrl,
      };
      updatedAssistantsArray = [...state.userProfile.assistants, finalAssistantConfig];
    }

    let updatedDatabasesArray = [...state.userProfile.databases, ...newDbEntries];
    if (editingAssistantId && (newAssistantDbIdToLink || !needsDatabaseConfiguration())) {
        const oldAssistantVersion = state.userProfile.assistants.find(a => a.id === editingAssistantId);
        const oldDbId = oldAssistantVersion?.databaseId;
        if (oldDbId) {
          // If DB is no longer needed OR new DB is different from old one
          if (!needsDatabaseConfiguration() || (newAssistantDbIdToLink && oldDbId !== newAssistantDbIdToLink)) {
            const isOldDbUsedByOthers = state.userProfile.assistants.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers && !newDbEntries.find(ndb => ndb.id === oldDbId)) {
                updatedDatabasesArray = updatedDatabasesArray.filter(db => db.id !== oldDbId);
            }
          }
        }
    }


    const finalUserProfile: UserProfile = {
      ...state.userProfile,
      currentPlan: selectedPlan,
      assistants: updatedAssistantsArray,
      databases: updatedDatabasesArray,
    };

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
    // Determine the actual step to render based on currentStep and whether DB config is needed
    let stepToRender = currentStep;

    if (isReconfiguring) {
      if (!needsDatabaseConfiguration()) {
        if (currentStep === 2) stepToRender = 3; // Plan selection (becomes step 2 visually)
        // if currentStep is 1, it's still 1 (Details)
      }
      // if needs DB config, currentStep maps directly to 1 (Details), 2 (DB), 3 (Plan)
      
      switch (stepToRender) {
        case 1: return <Step1AssistantDetails />;
        case 2: return needsDatabaseConfiguration() ? <Step2DatabaseConfig /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // If DB not needed, step 2 is Plan
        case 3: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // This is plan if DB was needed
        default: return null;
      }

    } else { // Standard flow
      if (!needsDatabaseConfiguration()) {
        if (currentStep === 2) stepToRender = 3; // Auth (becomes step 2 visually)
        if (currentStep === 3) stepToRender = 4; // Plan (becomes step 3 visually)
      }
      // if needs DB config, currentStep maps directly 1 (Details), 2 (DB), 3 (Auth), 4 (Plan)
      
      switch (stepToRender) {
        case 1: return <Step1AssistantDetails />;
        case 2: return needsDatabaseConfiguration() ? <Step2DatabaseConfig /> : <Step3Authentication />; // If DB not needed, step 2 is Auth
        case 3: return needsDatabaseConfiguration() ? <Step3Authentication /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // If DB needed, step 3 is Auth, else Plan
        case 4: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // This is plan if DB was needed
        default: return null;
      }
    }
  };

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
                dispatch({ type: 'SET_WIZARD_STEP', payload: needsDatabaseConfiguration() ? 3 : 2 }); // Go to Auth (step 3 or 2 if DB skipped)
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
                dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
                toast({ title: "Define tu Asistente", description: "Comencemos a definir tu asistente."});
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
            {state.isSetupComplete && !isReconfiguring && ( 
              <Button
                variant="outline"
                onClick={() => {
                  dispatch({ type: 'RESET_WIZARD' }); 
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

