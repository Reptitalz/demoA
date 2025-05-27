

"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES, MAX_WIZARD_STEPS } from "@/config/appConfig";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, isReconfiguring } = state.wizard;
  
  const effectiveMaxSteps = isReconfiguring ? 3 : MAX_WIZARD_STEPS;
  const progressPercentage = (currentStep / effectiveMaxSteps) * 100;

  let currentStepTitle = "";
  if (isReconfiguring) {
    if (currentStep === 1) currentStepTitle = WIZARD_STEP_TITLES[1];
    else if (currentStep === 2) currentStepTitle = WIZARD_STEP_TITLES[2];
    else if (currentStep === 3) currentStepTitle = WIZARD_STEP_TITLES[4]; // Plan selection
  } else {
    currentStepTitle = WIZARD_STEP_TITLES[currentStep] || `Paso ${currentStep}`;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-foreground">
          Paso {currentStep} de {effectiveMaxSteps}: {currentStepTitle}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
      </div>
      <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-primary" />
    </div>
  );
};

export default SetupProgressBar;

