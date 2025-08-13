
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
  
  const { effectiveMaxSteps, stepTitleKey, currentDisplayStep } = useMemo(() => {
    const totalSteps = dbNeeded ? 5 : 4;
    let displayStep = currentStep;
    
    // Map logical step to a display number, accounting for skips
    if (currentStep === 4 && !dbNeeded) {
        displayStep = 3;
    }
    if (currentStep === 5 && !dbNeeded) {
        displayStep = 4;
    }

    const keyMap = {
        1: 1, // Details
        2: 2, // Prompt
        3: dbNeeded ? 3 : 4, // DB or Terms
        4: dbNeeded ? 4 : 5, // Terms or Auth
        5: 5 // Auth
    }

    return { 
        effectiveMaxSteps: totalSteps, 
        stepTitleKey: keyMap[currentStep as keyof typeof keyMap],
        currentDisplayStep: displayStep
    };
  }, [dbNeeded, currentStep]);

  const stepTitle = WIZARD_STEP_TITLES[stepTitleKey as keyof typeof WIZARD_STEP_TITLES] || "Progreso";
  const progressPercentage = (currentDisplayStep / effectiveMaxSteps) * 100;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-foreground">
          Paso {currentDisplayStep} <span className="text-muted-foreground">de {effectiveMaxSteps}</span>
        </p>
        <p className="text-sm font-semibold text-primary">{stepTitle}</p>
      </div>
       <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentDisplayStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-brand-gradient" />
    </div>
  );
};

export default SetupProgressBar;
