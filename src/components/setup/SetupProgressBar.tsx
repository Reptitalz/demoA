"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES } from "@/config/appConfig";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, isReconfiguring, selectedPurposes } = state.wizard;
  
  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  
  const effectiveMaxSteps = isReconfiguring 
    ? (dbNeeded ? 4 : 3)
    : (dbNeeded ? 5 : 4);
  
  let stepTitleKey: number;
  // This logic maps the current sequential step number to its conceptual title
  if (isReconfiguring) {
    if (currentStep === 1) stepTitleKey = 1; // Details
    else if (currentStep === 2) stepTitleKey = 2; // Prompt
    else if (currentStep === 3) stepTitleKey = dbNeeded ? 3 : 5; // DB or Terms
    else if (currentStep === 4) stepTitleKey = 5; // Terms
    else stepTitleKey = currentStep;
  } else {
    if (currentStep === 1) stepTitleKey = 1; // Details
    else if (currentStep === 2) stepTitleKey = 2; // Prompt
    else if (currentStep === 3) stepTitleKey = dbNeeded ? 3 : 4; // DB or Auth
    else if (currentStep === 4) stepTitleKey = dbNeeded ? 4 : 5; // Auth or Terms
    else if (currentStep === 5) stepTitleKey = 5; // Terms
    else stepTitleKey = currentStep;
  }
  
  const stepTitle = WIZARD_STEP_TITLES[stepTitleKey] || "Progreso";
  const progressPercentage = (currentStep / effectiveMaxSteps) * 100;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-foreground">
          Paso {currentStep} <span className="text-muted-foreground">de {effectiveMaxSteps}</span>
        </p>
        <p className="text-sm font-semibold text-primary">{stepTitle}</p>
      </div>
       <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-brand-gradient" />
    </div>
  );
};

export default SetupProgressBar;
