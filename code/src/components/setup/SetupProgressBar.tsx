

"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES } from "@/config/appConfig";
import { useCallback } from "react";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, isReconfiguring, selectedPurposes } = state.wizard;
  
  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  
  // Determine effective max steps based on the flow
  let effectiveMaxSteps: number;
  if (isReconfiguring) {
    effectiveMaxSteps = dbNeeded ? 3 : 2; // Reconfig: 1.Details, 2.Prompt, 3.DB (optional)
  } else {
    effectiveMaxSteps = dbNeeded ? 4 : 3; // New: 1.Details, 2.Prompt, 3.DB (optional), 4.Auth
  }
  
  // Determine the title for the current logical step
  let stepTitleKey: number;
  if (isReconfiguring) {
      switch(currentStep) {
          case 1: stepTitleKey = 1; break; // Details
          case 2: stepTitleKey = 2; break; // Prompt
          case 3: stepTitleKey = 3; break; // DB
          default: stepTitleKey = currentStep;
      }
  } else {
       switch(currentStep) {
          case 1: stepTitleKey = 1; break; // Details
          case 2: stepTitleKey = 2; break; // Prompt
          case 3: stepTitleKey = dbNeeded ? 3 : 4; break; // DB or Auth
          case 4: stepTitleKey = 4; break; // Auth
          default: stepTitleKey = currentStep;
      }
  }
  
  const stepTitle = WIZARD_STEP_TITLES[stepTitleKey] || "Progreso";
  const progressPercentage = (currentStep / effectiveMaxSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-foreground">
          Paso {currentStep} de {effectiveMaxSteps}: {stepTitle}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
      </div>
      <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-primary" />
    </div>
  );
};

export default SetupProgressBar;
