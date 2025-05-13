
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
import { ArrowLeft, ArrowRight, Home } from 'lucide-react'; // Added Home icon
import type { UserProfile, AssistantConfig, DatabaseConfig } from '@/types';
import { useToast } from "@/hooks/use-toast"; 

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
        if (!authMethod) return "Por favor, autentica tu cuenta.";
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

    // Check if we are editing or adding. For this simplified example, we assume adding.
    // A more robust solution would involve passing an assistantId if editing.
    const existingAssistantIndex = state.userProfile.assistants.findIndex(
      // This condition for finding an existing assistant to update is a placeholder.
      // In a real scenario, you'd likely have an `editingAssistantId` in the wizard state.
      // For now, if the name matches an existing assistant and the wizard was initiated from reconfigure,
      // it might be an update. However, without a clear ID, we'll treat it as new.
      // The reconfigure logic in dashboard.tsx currently just resets the wizard with assistant details,
      // so this `handleCompleteSetup` will always create a "new" assistant with a new ID.
      // This is acceptable for the current scope.
      asst => asst.name === assistantName && state.isSetupComplete 
    );

    let updatedAssistants;
    if (existingAssistantIndex > -1 && state.userProfile.assistants[existingAssistantIndex].id) {
      // This path is unlikely to be hit with current reconfigure logic, but kept for conceptual integrity
      updatedAssistants = state.userProfile.assistants.map((asst, index) => 
        index === existingAssistantIndex ? { ...asst, ...newAssistant, id: asst.id } : asst
      );
    } else {
      updatedAssistants = [...state.userProfile.assistants, newAssistant];
    }
    
    const updatedDatabases = [...state.userProfile.databases, ...newDatabases];

    const userProfile: UserProfile = {
      ...state.userProfile, 
      isAuthenticated: true,
      authProvider: authMethod || state.userProfile.authProvider,
      email: authMethod === "google" ? "usuario@google.com" : authMethod === "microsoft" ? "usuario@microsoft.com" : state.userProfile.email, 
      currentPlan: selectedPlan,
      assistants: updatedAssistants,
      databases: updatedDatabases,
    };

    dispatch({ type: 'COMPLETE_SETUP', payload: userProfile });
    toast({
      title: "¡Configuración Completa!",
      description: "Tu Gestor AssistAI está listo.",
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
      <div className="space-y-8">
        <SetupProgressBar />
        <div className="min-h-[300px]"> 
         {renderStepContent()}
        </div>
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            {state.isSetupComplete && (
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="transition-transform transform hover:scale-105"
              >
                <Home className="mr-2 h-4 w-4" /> Volver al Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="transition-transform transform hover:scale-105"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
          </div>
          
          {currentStep < maxSteps && (
            <Button 
              onClick={handleNext} 
              className="bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105"
              disabled={!isStepValid()} 
            >
              Siguiente <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {/* The "Completar Configuración" button is rendered within Step4SubscriptionPlan when currentStep === maxSteps */}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;
