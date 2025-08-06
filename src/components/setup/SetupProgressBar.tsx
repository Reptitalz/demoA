
"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES } from "@/config/appConfig";
import { useCallback, useMemo } from "react";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, isReconfiguring, selectedPurposes } = state.wizard;
  
  const needsDatabaseConfiguration = useCallback(() => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  }, [selectedPurposes]);

  const dbNeeded = needsDatabaseConfiguration();
  
  const { effectiveMaxSteps, stepTitleKey } = useMemo(() => {
    if (isReconfiguring) {
      // Reconfiguring flow is simpler
      const maxSteps = dbNeeded ? 4 : 3;
      let titleKey: number;
      if (currentStep === 1) titleKey = 1; // Details
      else if (currentStep === 2) titleKey = 2; // Prompt
      else if (currentStep === 3) titleKey = dbNeeded ? 3 : 5; // DB or Terms (use key 5 for terms)
      else if (currentStep === 4) titleKey = 5; // Terms
      else titleKey = currentStep;
      return { effectiveMaxSteps: maxSteps, stepTitleKey: titleKey };
    } else {
      // New user registration flow
      const maxSteps = dbNeeded ? 5 : 4;
      let titleKey: number;
       if (dbNeeded) { // 5 steps
        const keyMap = [0, 1, 2, 3, 4, 5];
        titleKey = keyMap[currentStep];
      } else { // 4 steps
        const keyMap = [0, 1, 2, 4, 5]; // Skip DB config (step 3)
        titleKey = keyMap[currentStep];
      }
      return { effectiveMaxSteps: maxSteps, stepTitleKey: titleKey };
    }
  }, [isReconfiguring, dbNeeded, currentStep]);

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
