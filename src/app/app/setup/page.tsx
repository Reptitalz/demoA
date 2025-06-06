
"use client";

import { useState, useEffect, useCallback } from 'react';
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
  const { currentStep, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan, customPhoneNumber, isReconfiguring, editingAssistantId, pendingExcelProcessing } = state.wizard;

  const [userHasMadeInitialChoice, setUserHasMadeInitialChoice] = useState(false);
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false);

  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  useEffect(() => {
    if (state.userProfile.isAuthenticated || isReconfiguring) {
      setUserHasMadeInitialChoice(true);
    }
  }, [state.userProfile.isAuthenticated, isReconfiguring]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

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
        case 2:
          if (dbNeeded) {
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
            if (databaseOption.type === "google_sheets") {
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre descriptivo para tu Hoja de Google.";
                if (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/')) return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
            if (databaseOption.type === "excel") { 
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre para el Google Sheet que se generará desde Excel.";
                if (!pendingExcelProcessing?.file) return "Por favor, selecciona un archivo Excel.";
            }
            if (databaseOption.type === "smart_db" && !databaseOption.name?.trim()) return "Por favor, proporciona un nombre para tu Base de Datos Inteligente.";
          } else {
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
          break;
        case 3:
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    } else {
      switch (currentValidationStep) {
        case 1:
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          if (selectedPlan === 'business_270' && !isReconfiguring && !customPhoneNumber?.trim()) {
            return "Por favor, ingresa un número de teléfono para el asistente (Plan de Negocios).";
          }
          break;
        case 2:
           if (dbNeeded) {
            if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
             if (databaseOption.type === "google_sheets") { 
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre descriptivo para tu Hoja de Google.";
                if (!databaseOption.accessUrl?.trim() || !databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/')) return "Por favor, proporciona una URL válida de Hoja de Google.";
            }
            if (databaseOption.type === "excel") { 
                if (!databaseOption.name?.trim()) return "Por favor, proporciona un nombre para el Google Sheet que se generará desde Excel.";
                if (!pendingExcelProcessing?.file) return "Por favor, selecciona un archivo Excel.";
            }
            if (databaseOption.type === "smart_db" && !databaseOption.name?.trim()) return "Por favor, proporciona un nombre para tu Base de Datos Inteligente.";
           } else {
             if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
           }
          break;
        case 3:
          if (dbNeeded) {
            if (!authMethod) return "Por favor, autentica tu cuenta o elige continuar sin cuenta.";
          } else {
             if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          }
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
    const dbNeeded = needsDatabaseConfiguration();

    if (isFinalizingSetup) return false; 

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: return assistantName.trim() !== '' && selectedPurposes.size > 0;
        case 2:
          if (dbNeeded) {
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") { 
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            if (databaseOption.type === "excel") { 
                return !!databaseOption.name?.trim() && !!pendingExcelProcessing?.file; 
            }
            if (databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
            return true; 
          } else {
            return !!selectedPlan;
          }
        case 3:
          return !!selectedPlan;
        default: return false;
      }
    } else {
      switch (currentValidationStep) {
        case 1:
          const baseValid = assistantName.trim() !== '' && selectedPurposes.size > 0;
          if (selectedPlan === 'business_270' && !isReconfiguring) return baseValid && !!customPhoneNumber?.trim();
          return baseValid;
        case 2:
          if (dbNeeded) {
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") { 
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            if (databaseOption.type === "excel") {
                 return !!databaseOption.name?.trim() && !!pendingExcelProcessing?.file; 
            }
            if (databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
            return true;
          } else {
            return !!authMethod;
          }
        case 3:
           if (dbNeeded) {
            return !!authMethod;
           } else {
            return !!selectedPlan;
           }
        case 4:
          return !!selectedPlan;
        default: return false;
      }
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep === 1) {
        if (!needsDatabaseConfiguration()) {
          if (isReconfiguring) {
            dispatch({ type: 'SET_WIZARD_STEP', payload: 2 }); 
          } else {
            dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); 
          }
        } else {
          dispatch({ type: 'NEXT_WIZARD_STEP' });
        }
      } else if (currentStep === 2 && !needsDatabaseConfiguration() && !isReconfiguring) {
         dispatch({ type: 'SET_WIZARD_STEP', payload: 3 });
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

  const handleCompleteSetup = async () => {
    if (!isStepValid()) {
      toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
      return;
    }

    setIsFinalizingSetup(true);

    let currentDatabaseOption = { ...databaseOption }; 
    const currentPendingExcel = pendingExcelProcessing ? { ...pendingExcelProcessing } : null;

    if (currentPendingExcel?.file && currentDatabaseOption.type === 'excel') {
      if (!auth.currentUser) {
        toast({ title: "Autenticación Requerida", description: "Debes estar autenticado para procesar el archivo Excel. Por favor, vuelve al paso de autenticación o completa el inicio de sesión.", variant: "destructive" });
        setIsFinalizingSetup(false);
        return;
      }
      toast({ title: "Procesando Excel...", description: `Creando Google Sheet "${currentPendingExcel.targetSheetName}". Esto puede tardar un momento.` });
      try {
        const fileData = await fileToBase64(currentPendingExcel.file);
        
        if (!auth.currentUser) { // Double check just before API call
            toast({ title: "Error de Autenticación", description: "No se pudo verificar el usuario. Por favor, intenta iniciar sesión de nuevo.", variant: "destructive" });
            setIsFinalizingSetup(false);
            return;
        }
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch('/api/sheets-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ fileData, fileName: currentPendingExcel.targetSheetName, firebaseUid: auth.currentUser.uid }),
        });

        let errorMessageFromServer = `Error del servidor: ${response.status} ${response.statusText}. Intenta de nuevo más tarde o contacta soporte.`;
        if (!response.ok) {
          try {
            const errorResult = await response.json();
            errorMessageFromServer = errorResult.message || errorResult.error || errorMessageFromServer;
          } catch (jsonError) {
            const responseText = await response.text().catch(() => "No se pudo leer la respuesta del servidor.");
            console.error("Respuesta de /api/sheets-upload no fue JSON:", responseText);
            // errorMessageFromServer remains as initialized or slightly updated
          }
          throw new Error(errorMessageFromServer);
        }
        
        const result = await response.json();

        currentDatabaseOption = {
          type: 'google_sheets',
          name: result.spreadsheetName,
          accessUrl: result.spreadsheetUrl,
          originalFileName: currentPendingExcel.originalFileName,
          file: null,
        };
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
        toast({ title: "¡Éxito!", description: `Google Sheet "${result.spreadsheetName}" creado y vinculado.` });
        if (result.warning) {
          toast({ title: "Advertencia de la API", description: result.warning, variant: "default", duration: 7000 });
        }
      } catch (error: any) {
        toast({ title: "Error al Procesar Excel", description: error.message || "No se pudo generar el Google Sheet. La base de datos permanecerá como 'Excel' no procesado.", variant: "destructive" });
        setIsFinalizingSetup(false);
        return;
      }
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
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else if (selectedPlan === 'test_plan') {
             assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else { 
            assistantPhoneNumber = undefined; 
        }
    }


    if (needsDatabaseConfiguration() && currentDatabaseOption.type) {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let dbNameForConfig: string;
      let dbDetailsForConfig: string | undefined;
      let dbAccessUrlForConfig: string | undefined = currentDatabaseOption.accessUrl;

      if (currentDatabaseOption.type === 'google_sheets') {
        dbNameForConfig = currentDatabaseOption.name || `Hoja de Google ${state.userProfile.databases.length + 1 + newDbEntries.length}`;
        dbDetailsForConfig = currentDatabaseOption.originalFileName; 
      } else if (currentDatabaseOption.type === 'excel') { 
        dbNameForConfig = currentDatabaseOption.name || (currentPendingExcel?.originalFileName) || `Archivo Excel ${state.userProfile.databases.length + 1 + newDbEntries.length}`;
        dbDetailsForConfig = currentPendingExcel?.originalFileName;
        dbAccessUrlForConfig = undefined; 
      } else { 
        dbNameForConfig = currentDatabaseOption.name || `Smart DB ${state.userProfile.databases.length + 1 + newDbEntries.length}`;
        dbAccessUrlForConfig = undefined;
      }

      newDbEntries.push({
        id: dbId,
        name: dbNameForConfig,
        source: currentDatabaseOption.type, 
        details: dbDetailsForConfig,
        accessUrl: dbAccessUrlForConfig,
      });
      newAssistantDbIdToLink = dbId;
    } else if (!needsDatabaseConfiguration()) {
        dispatch({ type: 'SET_DATABASE_OPTION', payload: { type: null, name: '', file: null, accessUrl: '', originalFileName: '' } });
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' }); 
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
    
    if (state.wizard.pendingExcelProcessing) {
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
    }

    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    setIsFinalizingSetup(false);
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
         {isFinalizingSetup ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FaSpinner className="animate-spin h-10 w-10 text-primary mb-4" />
              <p className="text-lg font-semibold">Finalizando configuración...</p>
              {pendingExcelProcessing?.file && currentDatabaseOption.type === 'excel' && <p className="text-muted-foreground">Procesando archivo Excel y creando Google Sheet...</p>}
              <p className="text-muted-foreground">Por favor, espera.</p>
            </div>
         ) : renderStepContent()}
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
                disabled={isFinalizingSetup}
              >
                <FaHome className="mr-1 h-3 w-3" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isFinalizingSetup}
              className="transition-transform transform hover:scale-105 text-xs px-2 py-1"
            >
              <FaArrowLeft className="mr-1 h-3 w-3" /> Anterior
            </Button>
          </div>

          {currentStep < effectiveMaxSteps && (
            <Button
              onClick={handleNext}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() || isFinalizingSetup}
            >
              Siguiente <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
          {currentStep === effectiveMaxSteps && (
             <Button
              onClick={handleCompleteSetup}
              className="bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105 text-xs px-2 py-1"
              disabled={!isStepValid() || isFinalizingSetup}
            >
              {isFinalizingSetup && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"} {!isFinalizingSetup && <FaArrowRight className="ml-1 h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;

