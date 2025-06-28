

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
  const effectiveMaxSteps = isReconfiguring
    ? (dbNeeded ? 3 : 2) // Reconfig: 1.Details, 2.Prompt, 3.DB
    : (dbNeeded ? 4 : 3); // New: 1.Details, 2.Prompt, 3.DB, 4.Auth
  
  const progressPercentage = (currentStep / effectiveMaxSteps) * 100;

  let stepTitle = "";
  if (isReconfiguring) {
      if (currentStep === 1) stepTitle = WIZARD_STEP_TITLES[1]; // Details
      else if (currentStep === 2) stepTitle = WIZARD_STEP_TITLES[2]; // Prompt
      else if (currentStep === 3) stepTitle = WIZARD_STEP_TITLES[3]; // DB
  } else { // New setup
      if (currentStep === 1) stepTitle = WIZARD_STEP_TITLES[1]; // Details
      else if (currentStep === 2) stepTitle = WIZARD_STEP_TITLES[2]; // Prompt
      else if (currentStep === 3) stepTitle = dbNeeded ? WIZARD_STEP_TITLES[3] : WIZARD_STEP_TITLES[4]; // DB or Auth
      else if (currentStep === 4) stepTitle = WIZARD_STEP_TITLES[4]; // Auth
  }


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
