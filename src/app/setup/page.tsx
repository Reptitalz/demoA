
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
import { APP_NAME } from '@/config/appConfig';

const SetupPage = () => {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { currentStep, maxSteps, assistantName, selectedPurposes, databaseOption, authMethod, selectedPlan } = state.wizard;

  const getValidationMessage = (): string => {
     switch (currentStep) {
      case 1:
        if (!assistantName.trim()) return "Por favor, ingresa un nombre para el asistente.";
        if (selectedPurposes.size === 0) return "Por favor, selecciona al menos un propósito para tu asistente.";
        break;
      case 2:
        if (!databaseOption.type) return "Por favor, selecciona una opción de base de datos.";
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
    return "Por favor, completa el paso actual.";
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return assistantName.trim() !== '' && selectedPurposes.size > 0;
      case 2:
        if (!databaseOption.type) return false;
        if (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") {
          return !!databaseOption.name?.trim();
        }
        if (databaseOption.type === "excel") {
          return !!databaseOption.file;
        }
        return true; 
      case 3:
        return !!authMethod;
      case 4:
        return !!selectedPlan; 
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (isStepValid()) {
      if (currentStep < maxSteps) {
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
    
    const newAssistant: AssistantConfig = {
      id: `asst_${Date.now()}`, 
      name: assistantName,
      purposes: selectedPurposes,
      phoneLinked: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`, 
    };

    const newDatabases: DatabaseConfig[] = [];
    if (databaseOption.type) {
      const dbId = `db_${Date.now()}`;
      newDatabases.push({
        id: dbId,
        name: databaseOption.name || `Mi ${databaseOption.type.replace('_', ' ')}`,
        source: databaseOption.type,
        details: databaseOption.type === 'excel' && databaseOption.file ? databaseOption.file.name : databaseOption.name,
      });
      newAssistant.databaseId = dbId;
    }
    
    const existingAssistantIndex = state.userProfile.assistants.findIndex(
      asst => asst.name === assistantName && state.isSetupComplete 
    );

    let updatedAssistants;
    if (existingAssistantIndex > -1 && state.userProfile.assistants[existingAssistantIndex].id) {
      updatedAssistants = state.userProfile.assistants.map((asst, index) => 
        index === existingAssistantIndex ? { ...asst, ...newAssistant, id: asst.id } : asst
      );
    } else {
      updatedAssistants = [...state.userProfile.assistants, newAssistant];
    }
    
    const updatedDatabases = [...state.userProfile.databases, ...newDatabases];

    const finalUserProfile: UserProfile = {
      ...state.userProfile, 
      currentPlan: selectedPlan,
      assistants: updatedAssistants,
      databases: updatedDatabases,
    };

    dispatch({ type: 'COMPLETE_SETUP', payload: finalUserProfile });
    toast({
      title: "¡Configuración Completa!",
      description: `Tu ${APP_NAME} está listo.`,
      action: (
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          Ir al Panel
        </Button>
      ),
    });
    router.push('/dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1AssistantDetails />;
      case 2:
        return <Step2DatabaseConfig />;
      case 3:
        return <Step3Authentication />;
      case 4:
        return <Step4SubscriptionPlan onCompleteSetup={handleCompleteSetup} />;
      default:
        return null;
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
            {state.isSetupComplete && ( // Show "Volver al Panel" only if setup was already complete (editing/adding new from dashboard)
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
          
          {currentStep < maxSteps && (
            <Button 
              onClick={handleNext} 
              className="bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105 text-xs sm:text-sm"
              disabled={!isStepValid()} 
            >
              Siguiente <FaArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;
