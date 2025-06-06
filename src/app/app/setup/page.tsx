
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { FaArrowLeft, FaArrowRight, FaHome, FaSpinner } from 'react-icons/fa';
import { LogIn, UserPlus } from 'lucide-react';
import type { UserProfile, AssistantConfig, DatabaseConfig, DatabaseSource } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME, MAX_WIZARD_STEPS, DEFAULT_FREE_PLAN_PHONE_NUMBER, DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { sendAssistantCreatedWebhook } from '@/services/outboundWebhookService';
import { auth } from '@/lib/firebase';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan, customPhoneNumber, isReconfiguring, editingAssistantId } = state.wizard;
  // pendingExcelProcessing removed from wizard state destructuring

  const [userHasMadeInitialChoice, setUserHasMadeInitialChoice] = useState(false);
  // isFinalizingSetup can be removed if its only use was for Excel processing spinner
  // const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const needsDatabaseConfiguration = useCallback(() => {
    // Only "import_spreadsheet" (link Google Sheet) remains as a DB-requiring purpose
    return selectedPurposes.has('import_spreadsheet');
  }, [selectedPurposes]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated || isReconfiguring) {
      setUserHasMadeInitialChoice(true);
    }
  }, [state.userProfile.isAuthenticated, isReconfiguring]);

  // fileToBase64 function removed as Excel uploads are gone.

  const effectiveMaxSteps = isReconfiguring
    ? (needsDatabaseConfiguration() ? 3 : 2)
    : (needsDatabaseConfiguration() ? MAX_WIZARD_STEPS : MAX_WIZARD_STEPS - 1);


  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep;
    const dbNeeded = needsDatabaseConfiguration();

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          break;
        case 2: // Corresponds to DB config or Plan
          if (dbNeeded) { // If DB is needed, this is DB config step (Google Sheet link)
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos."; // Should always be google_sheets
            if (databaseOption.type === "google_sheets") {
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre descriptivo para tu Hoja de Google.";
                if (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/')) return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
            // Excel and SmartDB cases removed
          } else { // If DB not needed, this step is Plan
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 3: // This is always Plan if DB was needed and was step 2
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    } else { // Standard flow
      switch (currentValidationStep) {
        case 1: // Assistant Details
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPlan === 'business_270' && !isReconfiguring && !customPhoneNumber?.trim()) {
            return "Por favor, ingresa un número de teléfono para el asistente (Plan de Negocios).";
          }
          break;
        case 2: // DB Config or Auth
           if (dbNeeded) { // DB config (Google Sheet link)
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
             if (databaseOption.type === "google_sheets") {
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre descriptivo para tu Hoja de Google.";
                if (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/')) return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
            // Excel and SmartDB cases removed
           } else { // Auth
             if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
           }
          break;
        case 3: // Auth or Plan
          if (dbNeeded) { // Auth
            if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
          } else { // Plan
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 4: // Plan (if DB was present)
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    }
    return "Por favor, completa el paso actual.";
  };

  const isStepValid = (): boolean => {
    const currentValidationStep = currentStep;
    const dbNeeded = needsDatabaseConfiguration();

    // if (isFinalizingSetup) return false; // Removed isFinalizingSetup

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: return assistantName.trim() !== '' && selectedPurposes.size > 0;
        case 2: // DB or Plan
          if (dbNeeded) { // DB config (Google Sheet link)
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") {
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            // Excel and SmartDB cases removed
            return true;
          } else { // Plan
            return !!selectedPlan;
          }
        case 3: // Plan
          return !!selectedPlan;
        default: return false;
      }
    } else { // Standard flow
      switch (currentValidationStep) {
        case 1: // Details
          const baseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          if (selectedPlan === 'business_270' && !isReconfiguring) return baseValid && !!customPhoneNumber?.trim();
          return baseValid;
        case 2: // DB or Auth
          if (dbNeeded) { // DB (Google Sheet link)
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") {
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            // Excel and SmartDB cases removed
            return true;
          } else { // Auth
            return !!authMethod;
          }
        case 3: // Auth or Plan
           if (dbNeeded) { // Auth
            return !!authMethod;
           } else { // Plan
            return !!selectedPlan;
           }
        case 4: // Plan
          return !!selectedPlan;
        default: return false;
      }
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 1 && !needsDatabaseConfiguration()) {
        if (isReconfiguring) {
          dispatch({ type: 'SET_WIZARD_STEP', payload: 2 });
        } else {
          dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
        }
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
    if (currentStep === 3 && !needsDatabaseConfiguration() && !isReconfiguring) {
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
    } else if (currentStep === 2 && !needsDatabaseConfiguration() && isReconfiguring) {
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 });
    }
    else if (currentStep > 1) {
      dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
    }
  };

  const handleCompleteSetup = () => { // Made non-async
    if (!isStepValid()) {
      toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
      return;
    }

    // setIsFinalizingSetup(true); // Removed

    // Excel processing logic removed entirely.
    // currentDatabaseOption is effectively state.wizard.databaseOption now.

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
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else if (selectedPlan === 'test_plan') {
             assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else {
            assistantPhoneNumber = undefined;
        }
    }

    // Database creation logic simplifies: only "google_sheets" from wizard state
    if (needsDatabaseConfiguration() && databaseOption.type === 'google_sheets') {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newDbEntries.push({
        id: dbId,
        name: databaseOption.name || `Hoja de Google ${state.userProfile.databases.length + 1 + newDbEntries.length}`,
        source: databaseOption.type, // Will be 'google_sheets'
        details: databaseOption.name, // Store GSheet name as details
        accessUrl: databaseOption.accessUrl,
      });
      newAssistantDbIdToLink = dbId;
    } else if (!needsDatabaseConfiguration()) {
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: null, name: '', accessUrl: '' } });
    }


    if (editingAssistantId) {
      const assistantToUpdate = state.userProfile.assistants.find(a => a.id === editingAssistantId)!;
      finalAssistantConfig = {
        ...assistantToUpdate,
        name: finalAssistantName,
        purposes: selectedPurposes,
        phoneLinked: assistantPhoneNumber,
        databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink
                      : (needsDatabaseConfiguration() ? assistantToUpdate.databaseId : undefined),
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
          if (!needsDatabaseConfiguration() || (newAssistantDbIdToLink && oldDbId !== newAssistantDbIdToLink)) {
            const isOldDbUsedByOthers = updatedAssistantsArray.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
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

    // No more pendingExcelProcessing to clear
    // dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });

    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    // setIsFinalizingSetup(false); // Removed

    if (!editingAssistantId && finalAssistantConfig) {
      const assistantDb = newAssistantDbIdToLink
        ? updatedDatabasesArray.find(db => db.id === newAssistantDbIdToLink)
        : null;
      sendAssistantCreatedWebhook(finalUserProfile, finalAssistantConfig, assistantDb || null)
        .catch(err => console.error("Error sending assistant created webhook:", err));
    }

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
    let stepToRender = currentStep;
    const dbNeeded = needsDatabaseConfiguration();

    if (isReconfiguring) {
      if (!dbNeeded) {
        if (currentStep === 2) stepToRender = 3;
      }

      switch (stepToRender) {
        case 1: return <Step1AssistantDetails />;
        case 2: return dbNeeded ? <Step2DatabaseConfig /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
        case 3: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
        default: return null;
      }

    } else {
      if (!dbNeeded) {
        if (currentStep === 2) stepToRender = 3;
        if (currentStep === 3) stepToRender = 4;
      }
      switch (stepToRender) {
        case 1: return <Step1AssistantDetails />;
        case 2: return dbNeeded ? <Step2DatabaseConfig /> : <Step3Authentication />;
        case 3: return dbNeeded ? <Step3Authentication /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
        case 4: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
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
                dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
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
        <div className="min-h-[260px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[350px]">
         {/* Removed isFinalizingSetup check for spinner here */}
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
                // disabled={isFinalizingSetup} // Removed
              >
                <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 /*|| isFinalizingSetup*/} // Removed isFinalizingSetup
              className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
            >
              <FaArrowLeft className="mr-1 h-3 w-3" /> Anterior
            </Button>
          </div>

          {currentStep < effectiveMaxSteps && (
            <Button
              onClick={handleNext}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() /*|| isFinalizingSetup*/} // Removed isFinalizingSetup
            >
              Siguiente <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
          {currentStep === effectiveMaxSteps && (
             <Button
              onClick={handleCompleteSetup}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() /*|| isFinalizingSetup*/} // Removed isFinalizingSetup
            >
              {/* {isFinalizingSetup && <FaSpinner className="animate-spin mr-1 h-3 w-3" />} // Removed */}
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"}
              {/*!isFinalizingSetup &&*/ <FaArrowRight className="ml-1 h-3 w-3" />} {/* Removed !isFinalizingSetup */}
            </Button>
          )}
        </div>
         {/* Removed auth check for Excel upload as Excel uploads are gone
         {currentStep === effectiveMaxSteps && pendingExcelProcessing?.file && !auth.currentUser && (
            <p className="text-xs text-destructive text-center mt-2">
                Debes iniciar sesión para completar la configuración si has subido un archivo Excel.
            </p>
        )} */}
      </div>
    </PageContainer>
  );
};

export default SetupPage;
