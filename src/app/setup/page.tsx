

"use client";

import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import SetupProgressBar from '@/components/setup/SetupProgressBar';
import Step1AssistantDetails from '@/components/setup/Step1_AssistantDetails';
import Step2DatabaseConfig from '@/components/setup/Step2_DatabaseConfig';
import Step3Authentication from '@/components/setup/Step3_Authentication';
import Step4SubscriptionPlan from '@/components/setup/Step4_SubscriptionPlan';
import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight, FaHome } from 'react-icons/fa'; 
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast"; 
import { APP_NAME, MAX_WIZARD_STEPS } from '@/config/appConfig';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan, isReconfiguring, editingAssistantId } = state.wizard;

  const effectiveMaxSteps = isReconfiguring ? 3 : MAX_WIZARD_STEPS;

  const getValidationMessage = (): string => {
    const currentValidationStep = currentStep; // Actual step in UI
    
    if (isReconfiguring) {
      switch (currentValidationStep) {
        case 1: // Assistant Details
          if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
          if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
          break;
        case 2: // Database Config
          if (!databaseOption.type && selectedPurposes.size > 0 && (selectedPurposes.has('import_db_excel') || selectedPurposes.has('import_db_google_sheets') || selectedPurposes.has('create_smart_db'))) {
            // Only require DB if a purpose needing it is selected.
            // This logic might need refinement based on how purposes are tied to DB requirements.
            // For now, let's assume any DB-related purpose implies DB config is needed.
            return "Por favor, selecciona una opción de base de datos.";
          }
          if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && !databaseOption.name?.trim()) {
              return `Por favor, proporciona un nombre/enlace para tu ${databaseOption.type === "google_sheets" ? "Hoja de Google" : "Base de Datos Inteligente"}.`;
          }
          if (databaseOption.type === "excel" && !databaseOption.file && !databaseOption.name) { // If reconfiguring an excel DB, name might be present without a new file
            // If editing, an existing file might be represented by its name. A new file upload would override.
            // For now, if type is excel and no file is newly uploaded AND no existing name, it's an issue.
            const assistantBeingEdited = editingAssistantId ? state.userProfile.assistants.find(a => a.id === editingAssistantId) : null;
            const existingDb = assistantBeingEdited?.databaseId ? state.userProfile.databases.find(db => db.id === assistantBeingEdited.databaseId) : null;
            if(!(existingDb && existingDb.source === 'excel')) {
                 return "Por favor, sube un archivo de Excel.";
            }
          }
          break;
        case 3: // Subscription Plan
          if (!selectedPlan) return "Por favor, selecciona un plan de suscripción.";
          break;
      }
    } else { // Standard setup flow
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
          if (!databaseOption.type) { // If no DB type is selected
            // It's valid IF no purpose requires a DB or if it's reconfiguring and had no DB before
            // This simplistic check passes if no DB is chosen. More complex logic might be needed
            // if certain purposes MANDATE a DB.
            return true; 
          }
          if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") return !!databaseOption.name?.trim();
          if (databaseOption.type === "excel") {
            // If reconfiguring, name might exist from before. If new file, file must exist.
            return !!databaseOption.file || (!!databaseOption.name && !databaseOption.file);
          }
          return true;
        case 3: return !!selectedPlan;
        default: return false;
      }
    } else { // Standard setup flow
      switch (currentValidationStep) {
        case 1: return assistantName.trim() !== '' && selectedPurposes.size > 0;
        case 2:
          if (!databaseOption.type) {
             // If no DB type, valid only if no purpose needs it. Simplistic: assume optional for now if not chosen.
            return !Array.from(selectedPurposes).some(p => ['import_db_excel', 'import_db_google_sheets', 'create_smart_db'].includes(p));
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

  const handleCompleteSetup = () => {
    if (!isStepValid()) { 
      toast({ title: "Error", description: getValidationMessage(), variant: "destructive" });
      return;
    }
    
    let finalAssistantConfig: AssistantConfig;
    let updatedAssistantsArray: AssistantConfig[];
    const newDbEntries: DatabaseConfig[] = [];
    let newAssistantDbIdToLink: string | undefined = undefined;

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
        name: assistantName,
        purposes: selectedPurposes,
        databaseId: newAssistantDbIdToLink !== undefined ? newAssistantDbIdToLink : assistantToUpdate.databaseId,
      };
      updatedAssistantsArray = state.userProfile.assistants.map(asst =>
        asst.id === editingAssistantId ? finalAssistantConfig : asst
      );
    } else {
      finalAssistantConfig = {
        id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: assistantName,
        purposes: selectedPurposes,
        phoneLinked: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        databaseId: newAssistantDbIdToLink,
      };
      updatedAssistantsArray = [...state.userProfile.assistants, finalAssistantConfig];
    }
    
    // Filter out old DB if it was replaced and is not used by other assistants
    let updatedDatabasesArray = [...state.userProfile.databases, ...newDbEntries];
    if (editingAssistantId && newAssistantDbIdToLink) {
        const oldAssistantVersion = state.userProfile.assistants.find(a => a.id === editingAssistantId);
        const oldDbId = oldAssistantVersion?.databaseId;
        if (oldDbId && oldDbId !== newAssistantDbIdToLink) {
            const isOldDbUsedByOthers = state.userProfile.assistants.some(a => a.id !== editingAssistantId && a.databaseId === oldDbId);
            if (!isOldDbUsedByOthers && !newDbEntries.find(ndb => ndb.id === oldDbId)) { // Ensure it's not the same db somehow
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

    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    toast({
      title: isReconfiguring ? "¡Asistente Actualizado!" : "¡Configuración Completa!",
      description: `${finalAssistantConfig.name} ${isReconfiguring ? 'ha sido actualizado.' : `está listo.`}`,
      action: (
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          Ir al Panel
        </Button>
      ),
    });
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    if (isReconfiguring) {
      switch (currentStep) {
        case 1: return <Step1AssistantDetails />;
        case 2: return <Step2DatabaseConfig />;
        case 3: return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />; // Plan selection is step 3
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

  return (
    <PageContainer>
      <div className="space-y-6">
        <SetupProgressBar />
        <div className="min-h-[280px] sm:min-h-[300px]"> 
         {renderStepContent()}
        </div>
        <div className="flex justify-between items-center pt-5 border-t">
          <div className="flex gap-2">
            {state.isSetupComplete && ( 
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="transition-transform transform hover:scale-105 text-xs sm:text-sm"
              >
                <FaHome className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="transition-transform transform hover:scale-105 text-xs sm:text-sm"
            >
              <FaArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Anterior
            </Button>
          </div>
          
          {currentStep < effectiveMaxSteps && (
            <Button 
              onClick={handleNext} 
              className="bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105 text-xs sm:text-sm"
              disabled={!isStepValid()} 
            >
              Siguiente <FaArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          {currentStep === effectiveMaxSteps && ( // Show complete button on the last step
             <Button 
              onClick={handleCompleteSetup} 
              className="bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105 text-xs sm:text-sm"
              disabled={!isStepValid()}
            >
              {isReconfiguring ? "Guardar Cambios" : "Completar Configuración"} <FaArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;

