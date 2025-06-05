

"use client";

import { Progress } from "@/components/ui/progress";
import { useApp } from "@/providers/AppProvider";
import { WIZARD_STEP_TITLES, MAX_WIZARD_STEPS } from "@/config/appConfig";

const SetupProgressBar = () => {
  const { state } = useApp();
  const { currentStep, isReconfiguring, selectedPurposes } = state.wizard;
  
  const needsDatabaseConfiguration = () => {
    return selectedPurposes.has('import_spreadsheet') || selectedPurposes.has('create_smart_db');
  };

  // Determine the actual number of steps in the current flow
  const effectiveMaxSteps = isReconfiguring 
    ? (needsDatabaseConfiguration() ? 3 : 2) // Reconfig: Details, DB (optional), Plan
    : (needsDatabaseConfiguration() ? MAX_WIZARD_STEPS : MAX_WIZARD_STEPS - 1); // New: Details, DB (optional), Auth, Plan

  // Determine the current visual step number (e.g. if DB is skipped, Auth becomes "Step 2")
  let visualStepNumber = currentStep;
  if (!needsDatabaseConfiguration()) {
    if (isReconfiguring) {
      // No DB in reconfig: Step 1 (Details), Step 2 (Plan)
      // currentStep will be 1 or 2
    } else {
      // No DB in standard flow: Step 1 (Details), Step 2 (Auth), Step 3 (Plan)
      if (currentStep > 1) { // currentStep can be 1, 3, 4 from original flow, map to 1, 2, 3
         // If original step 3 (Auth) -> visual step 2
         // If original step 4 (Plan) -> visual step 3
         // Current step is 1 (Details) -> visual step 1
         // Current step is 3 (Auth in logic, after skipping DB) -> visual step 2
         // Current step is 4 (Plan in logic, after skipping DB and doing Auth) -> visual step 3
         
         // This logic can get complex, let's use a simpler approach for title:
         // Title will be based on the actual component being rendered
      }
    }
  }
  
  const progressPercentage = (currentStep / effectiveMaxSteps) * 100;

  let currentStepTitleKey = currentStep;
  if (isReconfiguring) {
      if (currentStep === 1) currentStepTitleKey = 1; // Details
      else if (currentStep === 2) currentStepTitleKey = needsDatabaseConfiguration() ? 2 : 4; // DB or Plan
      else if (currentStep === 3) currentStepTitleKey = 4; // Plan (if DB was step 2)
  } else {
      if (currentStep === 1) currentStepTitleKey = 1; // Details
      else if (currentStep === 2) currentStepTitleKey = needsDatabaseConfiguration() ? 2 : 3; // DB or Auth
      else if (currentStep === 3) currentStepTitleKey = needsDatabaseConfiguration() ? 3 : 4; // Auth or Plan
      else if (currentStep === 4) currentStepTitleKey = 4; // Plan
  }
  const currentStepTitle = WIZARD_STEP_TITLES[currentStepTitleKey] || `Paso ${currentStep}`;


  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-foreground">
          {/* Display a possibly adjusted visual step number if titles are hard to map */}
          Paso {currentStep} de {effectiveMaxSteps}: {currentStepTitle}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</p>
      </div>
      <Progress value={progressPercentage} aria-label={`Progreso de configuración: ${currentStep} de ${effectiveMaxSteps} pasos completados`} className="h-2 [&>div]:bg-primary" />
    </div>
  );
};

export default SetupProgressBar;

