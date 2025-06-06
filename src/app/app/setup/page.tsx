
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Added React import
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
  const [isFinalizingSetup, setIsFinalizingSetup] = useState(false); // Used for the final completion loading

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
    ? (needsDatabaseConfiguration() ? 3 : 2) // Reconfig: Details, DB (optional), Plan
    : (needsDatabaseConfiguration() ? MAX_WIZARD_STEPS : MAX_WIZARD_STEPS - 1); // New: Details, DB (optional), Auth, Plan


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
          if (dbNeeded) { // If DB is needed, this is DB config step
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
           if (dbNeeded) { // DB config
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

    if (isFinalizingSetup) return false; 

    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: return assistantName.trim() !== '' && selectedPurposes.size > 0;
        case 2: // DB or Plan
          if (dbNeeded) { // DB config
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") { 
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            if (databaseOption.type === "excel") { 
                return !!databaseOption.name?.trim() && !!pendingExcelProcessing?.file; 
            }
            if (databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
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
          if (dbNeeded) { // DB
            if (!databaseOption.type) return false;
            if (databaseOption.type === "google_sheets") { 
                return !!databaseOption.name?.trim() && !!databaseOption.accessUrl?.trim() && databaseOption.accessUrl.startsWith('https://docs.google.com/spreadsheets/');
            }
            if (databaseOption.type === "excel") {
                 return !!databaseOption.name?.trim() && !!pendingExcelProcessing?.file; 
            }
            if (databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
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
      // Skip DB step if not needed
      if (currentStep === 1 && !needsDatabaseConfiguration()) {
        if (isReconfiguring) { // Reconfig: Details -> Plan
          dispatch({ type: 'SET_WIZARD_STEP', payload: 2 }); // Step 2 in reconfig (no DB) is Plan
        } else { // New: Details -> Auth
          dispatch({ type: 'SET_WIZARD_STEP', payload: 3 }); // Step 3 in new (no DB) is Auth
        }
      } 
      // Skip Auth step if DB was skipped (new flow: Details -> Auth -> Plan becomes Details -> Plan)
      // This condition needs to be more specific: if current step is where Auth *would* be (after DB or after Details if no DB)
      // For "no DB" in new flow, currentStep is 2 (Auth), next is 3 (Plan)
      // Original logic: if (currentStep === 2 && !needsDatabaseConfiguration() && !isReconfiguring) this was for Details -> Auth -> Plan
      // Correct logic for skipping Auth:
      // If current step is Auth (step 3 if DB was present, step 2 if DB was skipped), and user chose "no_account"
      // This skip logic is tricky. It's often better to just show the step.
      // Let's keep it simple: just advance. Auth step will appear.
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
    // Handle skipping back over DB if it wasn't needed
    if (currentStep === 3 && !needsDatabaseConfiguration() && !isReconfiguring) { // Coming from Auth (step 3, no DB) back to Details (step 1)
      dispatch({ type: 'SET_WIZARD_STEP', payload: 1 }); 
    } else if (currentStep === 2 && !needsDatabaseConfiguration() && isReconfiguring) { // Coming from Plan (step 2, no DB in reconfig) back to Details (step 1)
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

    let processedDatabaseOption = { ...databaseOption }; // Start with current DB option from wizard state
    const currentPendingExcel = pendingExcelProcessing ? { ...pendingExcelProcessing } : null;

    if (currentPendingExcel?.file && processedDatabaseOption.type === 'excel') {
      if (!auth.currentUser) {
        toast({ title: "Autenticación Requerida", description: "Debes estar autenticado para procesar el archivo Excel. Por favor, vuelve al paso de autenticación o completa el inicio de sesión.", variant: "destructive" });
        setIsFinalizingSetup(false);
        return;
      }
      toast({ title: "Procesando Excel...", description: `Creando Google Sheet "${currentPendingExcel.targetSheetName}". Esto puede tardar un momento.` });
      try {
        const fileData = await fileToBase64(currentPendingExcel.file);
        
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
             try {
                const responseText = await response.text();
                console.error("Respuesta de /api/sheets-upload no fue JSON:", responseText);
                errorMessageFromServer = responseText.substring(0, 200); // Take a snippet
            } catch (textError) {
                // console.error("No se pudo leer la respuesta del servidor como texto.");
            }
          }
          toast({ title: "Error al Procesar Excel", description: errorMessageFromServer, variant: "destructive", duration: 7000 });
          setIsFinalizingSetup(false);
          return;
        }
        
        const result = await response.json();

        // Update processedDatabaseOption to reflect the newly created Google Sheet
        processedDatabaseOption = {
          type: 'google_sheets',
          name: result.spreadsheetName, // Name of the created Google Sheet
          accessUrl: result.spreadsheetUrl, // URL of the created Google Sheet
          originalFileName: currentPendingExcel.originalFileName, // Keep original Excel filename for reference
          file: null, // Clear the file as it's processed
        };
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
        toast({ title: "¡Éxito!", description: `Google Sheet "${result.spreadsheetName}" creado y vinculado.` });
        if (result.warning) {
          toast({ title: "Advertencia de la API", description: result.warning, variant: "default", duration: 7000 });
        }
      } catch (error: any) {
        console.error("Error en handleCompleteSetup durante el procesamiento de Excel:", error);
        toast({ title: "Error al Procesar Excel", description: error.message || "No se pudo generar el Google Sheet. La base de datos permanecerá como 'Excel' no procesado.", variant: "destructive" });
        setIsFinalizingSetup(false);
        return;
      }
    }

    // Proceed with creating/updating assistant and user profile
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
        } else if (selectedPlan === 'test_plan') { // For testing webhook without Stripe/Vonage
            assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        } else if (assistantToUpdate.phoneLinked === DEFAULT_FREE_PLAN_PHONE_NUMBER && selectedPlan !== 'free' && selectedPlan !== 'test_plan') {
            // User is upgrading from free and had default number, new number will be provisioned by Stripe webhook
            assistantPhoneNumber = undefined; 
        } else if (selectedPlan === 'business_270') {
             // For business plan, if they are reconfiguring, keep existing custom number if it wasn't the default free one.
             // If it *was* the default free one, and they are now on business, it should become undefined to let Stripe webhook handle.
             // Or, if they provided a new custom number in step 1 (which is not part of reconfig flow currently)
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        } else { // For other paid plans (e.g., premium_179)
            // Keep existing number if it wasn't the default free one. New paid numbers are provisioned by Stripe webhook.
            assistantPhoneNumber = assistantToUpdate.phoneLinked !== DEFAULT_FREE_PLAN_PHONE_NUMBER ? assistantToUpdate.phoneLinked : undefined;
        }
    } else { // New assistant
        assistantImageUrl = DEFAULT_ASSISTANT_IMAGE_URL;
        if (selectedPlan === 'business_270') {
            assistantPhoneNumber = customPhoneNumber || undefined; // Use custom if provided in Step 1
        } else if (selectedPlan === 'free') {
            assistantPhoneNumber = DEFAULT_FREE_PLAN_PHONE_NUMBER;
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else if (selectedPlan === 'test_plan') { // For testing webhook without Stripe/Vonage
             assistantPhoneNumber = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            if (state.userProfile.assistants.length === 0) finalAssistantName = "Hey Asistente";
        } else { // Other paid plans (premium_179), number will be provisioned by Stripe webhook
            assistantPhoneNumber = undefined; 
        }
    }


    if (needsDatabaseConfiguration() && processedDatabaseOption.type) {
      const dbId = `db_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newDbEntries.push({
        id: dbId,
        name: processedDatabaseOption.name || `DB ${state.userProfile.databases.length + 1 + newDbEntries.length}`,
        source: processedDatabaseOption.type, 
        details: processedDatabaseOption.originalFileName || processedDatabaseOption.name, // Use original excel name if available
        accessUrl: processedDatabaseOption.accessUrl,
      });
      newAssistantDbIdToLink = dbId;
    } else if (!needsDatabaseConfiguration()) {
        // Clear any lingering DB options if no DB is needed for this assistant
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
        // If a new DB was created (newAssistantDbIdToLink is set), use it.
        // Else, if DB is needed, keep old DB (assistantToUpdate.databaseId).
        // Else (DB not needed), set databaseId to undefined.
        databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink 
                      : (needsDatabaseConfiguration() ? assistantToUpdate.databaseId : undefined),
        imageUrl: assistantImageUrl,
      };
      updatedAssistantsArray = state.userProfile.assistants.map(asst =>
        asst.id === editingAssistantId ? finalAssistantConfig : asst
      );
    } else { // New assistant
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

    // Database cleanup logic: if an old DB was replaced and no longer used, remove it
    let updatedDatabasesArray = [...state.userProfile.databases, ...newDbEntries];
    if (editingAssistantId && (newAssistantDbIdToLink || !needsDatabaseConfiguration())) {
        const oldAssistantVersion = state.userProfile.assistants.find(a => a.id === editingAssistantId);
        const oldDbId = oldAssistantVersion?.databaseId;
        if (oldDbId) { // If the assistant being edited had a DB
          // And if (DB is no longer needed OR a new DB was linked AND it's different from old one)
          if (!needsDatabaseConfiguration() || (newAssistantDbIdToLink && oldDbId !== newAssistantDbIdToLink)) {
            // Check if this old DB is used by any *other* assistant
            const isOldDbUsedByOthers = updatedAssistantsArray.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers && !newDbEntries.find(ndb => ndb.id === oldDbId) /* Make sure new DB isn't somehow the old one */) {
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
    
    if (state.wizard.pendingExcelProcessing) { // Should have been cleared if successful, but as a safeguard
        dispatch({ type: 'CLEAR_PENDING_EXCEL_PROCESSING' });
    }

    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    setIsFinalizingSetup(false);

    // Send webhook only if it's a new assistant being created
    if (!editingAssistantId && finalAssistantConfig) {
      const assistantDb = newAssistantDbIdToLink
        ? updatedDatabasesArray.find(db => db.id === newAssistantDbIdToLink)
        : null;
      // Do not await this, let it run in background
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
      // Reconfig flow: 1=Details, 2=DB (if needed) OR Plan, 3=Plan (if DB was 2)
      if (!dbNeeded) { // No DB needed in reconfig
        if (currentStep === 2) stepToRender = 3; // Map logical step 2 (Plan) to component for step 3 (Plan)
      }
      
      switch (stepToRender) {
        case 1: return <Step1AssistantDetails />; 
        case 2: return dbNeeded ? <Step2DatabaseConfig /> : <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // If no DB, step 2 is Plan
        case 3: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // If DB was step 2, then step 3 is Plan
        default: return null;
      }

    } else { // New setup flow
      // New flow: 1=Details, 2=DB (if needed) OR Auth, 3=Auth (if DB was 2) OR Plan, 4=Plan (if DB was 2 & Auth was 3)
      if (!dbNeeded) { // No DB needed in new setup
        if (currentStep === 2) stepToRender = 3; // Map logical step 2 (Auth) to component for step 3 (Auth)
        if (currentStep === 3) stepToRender = 4; // Map logical step 3 (Plan) to component for step 4 (Plan)
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
              {pendingExcelProcessing?.file && databaseOption.type === 'excel' && <p className="text-muted-foreground">Procesando archivo Excel y creando Google Sheet...</p>}
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
              disabled={!isStepValid() || isFinalizingSetup || (pendingExcelProcessing?.file && !auth.currentUser)}
            >
              {isFinalizingSetup && <FaSpinner className="animate-spin mr-1 h-3 w-3" />}
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"} {!isFinalizingSetup && <FaArrowRight className="ml-1 h-3 w-3" />}
            </Button>
          )}
        </div>
         {currentStep === effectiveMaxSteps && pendingExcelProcessing?.file && !auth.currentUser && (
            <p className="text-xs text-destructive text-center mt-2">
                Debes iniciar sesión para completar la configuración si has subido un archivo Excel.
            </p>
        )}
      </div>
    </PageContainer>
  );
};

export default SetupPage;
