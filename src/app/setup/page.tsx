
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
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        if (!assistantName.trim()) return "Please enter an assistant name.";
        if (selectedPurposes.size === 0) return "Please select at least one purpose for your assistant.";
        break;
      case 2:
        if (!databaseOption.type) return "Please select a database option.";
        if (databaseOption.type && (databaseOption.type === "google_sheets" || databaseOption.type === "smart_db") && !databaseOption.name?.trim()) {
            return `Please provide a name/link for your ${databaseOption.type === "google_sheets" ? "Google Sheet" : "Smart Database"}.`;
        }
        if (databaseOption.type === "excel" && !databaseOption.file) return "Please upload an Excel file.";
        break;
      case 3:
        if (!authMethod) return "Please authenticate your account.";
        break;
      case 4: 
        if (!selectedPlan) return "Please select a subscription plan.";
        break;
    }
    return "Please complete the current step.";
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
        return true; // Should not happen if type is one of the above
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
        title: "Validation Error",
        description: getValidationMessage(),
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_WIZARD_STEP' });
  };

  const handleCompleteSetup = () => {
    if (!isStepValid()) { // Final validation before completing
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
        name: databaseOption.name || `My ${databaseOption.type.replace('_', ' ')}`,
        source: databaseOption.type,
        details: databaseOption.type === 'excel' && databaseOption.file ? databaseOption.file.name : databaseOption.name,
      });
      newAssistant.databaseId = dbId;
    }

    // Find existing user profile to update or create a new one
    // For this SPA mock, we're typically updating the global state's userProfile
    const updatedAssistants = [...state.userProfile.assistants, newAssistant];
    const updatedDatabases = [...state.userProfile.databases, ...newDatabases];

    const userProfile: UserProfile = {
      ...state.userProfile, // Preserve any existing user details if reconfiguring/adding
      isAuthenticated: true,
      authProvider: authMethod || state.userProfile.authProvider,
      email: authMethod === "google" ? "user@google.com" : authMethod === "microsoft" ? "user@microsoft.com" : state.userProfile.email, 
      currentPlan: selectedPlan,
      assistants: updatedAssistants,
      databases: updatedDatabases,
    };

    dispatch({ type: 'COMPLETE_SETUP', payload: userProfile });
    toast({
      title: "Setup Complete!",
      description: "Your AssistAI Manager is ready.",
      action: (
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
          Go to Dashboard
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
        <div className="min-h-[300px]"> {/* Ensure consistent height for step content */}
         {renderStepContent()}
        </div>
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="transition-transform transform hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          {/* The "Complete Setup" button is inside Step4, so only show "Next" for other steps */}
          {currentStep < maxSteps && (
            <Button 
              onClick={handleNext} 
              className="bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105"
              disabled={!isStepValid()} // Disable if current step not valid for "Next"
            >
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default SetupPage;
