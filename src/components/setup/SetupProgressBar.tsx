
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
    let totalSteps = 2; // Type, Details
    totalSteps++; // Prompt
    if (dbNeeded) totalSteps++;
    totalSteps++; // Terms
    totalSteps++; // Auth
    
    let displayStep = currentStep;
    
    if(!isReconfiguring) {
      // Normal flow with Type selection
      if (currentStep >= 5 && !dbNeeded) displayStep = currentStep - 1;
    } else {
      // Reconfiguring flow (no Type, no Auth)
      totalSteps = 2; // Details, Prompt
      if (dbNeeded) totalSteps++;
      totalSteps++; // Terms
      if (currentStep >= 3 && !dbNeeded) displayStep = currentStep - 1;
    }
    
    const keyMap: Record<number, number> = isReconfiguring 
    ? {
        1: 2, // Details
        2: 3, // Prompt
        3: dbNeeded ? 4 : 5, // DB or Terms
        4: 5 // Terms
    }
    : {
        1: 1, // Type
        2: 2, // Details
        3: 3, // Prompt
        4: dbNeeded ? 4 : 5, // DB or Terms
        5: dbNeeded ? 5 : 6, // Terms or Auth
        6: 6, // Auth
    };


    return { 
        effectiveMaxSteps: totalSteps, 
        stepTitleKey: keyMap[currentStep as keyof typeof keyMap],
        currentDisplayStep: displayStep
    };
  }, [dbNeeded, currentStep, isReconfiguring]);

  const stepTitle = WIZARD_STEP_TITLES[stepTitleKey as keyof typeof WIZARD_STEP_TITLES] || "Progreso";
  const progressPercentage = (currentDisplayStep / effectiveMaxSteps) * 100;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-foreground">
          Paso {currentDisplayStep} <span className="text-muted-foreground">de {effectiveMaxSteps}</span>
        </p>
        <p className="text-sm font-semibold text-green-600">{stepTitle}</p>
      </div>
       <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentDisplayStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-green-gradient" />
    </div>
  );
};

export default SetupProgressBar;
