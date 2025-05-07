
"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES } from "@/config/appConfig";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, maxSteps } = state.wizard;
  const progressPercentage = (currentStep / maxSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} of {maxSteps}: {WIZARD_STEP_TITLES[currentStep] || `Step ${currentStep}`}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
      </div>
      <Progress value={progressPercentage} aria-label={`Setup progress: ${currentStep} of ${maxSteps} steps complete`} className="h-2 [&>div]:bg-primary" />
    </div>
  );
};

export default SetupProgressBar;
