
"use client";

import { useApp } from "@/providers/AppProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assistantPurposesConfig } from "@/config/appConfig";
import type { AssistantPurposeType } from "@/types";
import { FaPhone } from "react-icons/fa";

const Step1AssistantDetails = () => {
  const { state, dispatch } = useApp();
  const { assistantName, selectedPurposes, customPhoneNumber, selectedPlan, isReconfiguring } = state.wizard;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: e.target.value });
  };

  const handlePurposeToggle = (purposeId: AssistantPurposeType) => {
    const newPurposes = new Set(selectedPurposes);

    if (newPurposes.has(purposeId)) {
      newPurposes.delete(purposeId);
    } else {
      newPurposes.add(purposeId);
      // Mutual exclusion logic
      if (purposeId === 'import_spreadsheet' && newPurposes.has('create_smart_db')) {
        newPurposes.delete('create_smart_db');
      } else if (purposeId === 'create_smart_db' && newPurposes.has('import_spreadsheet')) {
        newPurposes.delete('import_spreadsheet');
      }
    }
    // Dispatch a single update with the modified set
    // This requires a new action type or modifying TOGGLE_ASSISTANT_PURPOSE to accept a Set
    // For simplicity, let's dispatch individual toggles but be mindful of potential re-renders.
    // A more optimized way would be to have an action that takes the full new Set.

    // To reflect the changes accurately, we'll create a new action that sets the purposes directly
    // For now, let's stick to the existing TOGGLE_ASSISTANT_PURPOSE and dispatch it.
    // This will work but might cause an extra re-render if both import_spreadsheet and create_smart_db were involved.
    // A better approach:
    // 1. Define a new action in AppProvider: `SET_ASSISTANT_PURPOSES` that takes `Set<AssistantPurposeType>`.
    // 2. Call that here: `dispatch({ type: 'SET_ASSISTANT_PURPOSES', payload: newPurposes });`
    // For now, using existing toggle (will work fine, just less optimized for this specific interaction)

    // The existing TOGGLE_ASSISTANT_PURPOSE action in the reducer already handles adding/removing.
    // We need to ensure that if one is added, the other is removed *if present*.
    // The reducer's TOGGLE_ASSISTANT_PURPOSE doesn't have this mutual exclusion logic internally.
    // So, we'll manage the set here and then dispatch a series of toggles or a new "set purposes" action.

    // Let's assume we'll modify AppProvider to have a SET_ASSISTANT_PURPOSES action.
    // If not, we'd have to dispatch TOGGLE for each change which is less ideal.
    // For now, I will proceed as if TOGGLE_ASSISTANT_PURPOSE will be used, and will
    // adjust AppProvider if necessary. The core logic is to modify `newPurposes` correctly.

    // Re-dispatching TOGGLE for each involved purpose to update the state based on newPurposes
    // This is slightly inefficient but works with the current reducer action.
    // A better way is to add a new action 'SET_SELECTED_PURPOSES' to the reducer.
    // For this change, I'll directly dispatch TOGGLE and the logic in TOGGLE_ASSISTANT_PURPOSE in reducer will handle it.
    // The mutual exclusion logic is now implemented here *before* dispatching.

    // The dispatch in the original code for TOGGLE_ASSISTANT_PURPOSE will reflect the purposeId clicked.
    // We need to ensure the other one is deselected if this one is selected.

    // Revised logic:
    if (selectedPurposes.has(purposeId)) { // If it's currently selected, deselect it
        dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId });
    } else { // If it's not selected, select it AND deselect the other if it's the conflicting one
        dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId }); // Select the current one
        if (purposeId === 'import_spreadsheet' && selectedPurposes.has('create_smart_db')) {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: 'create_smart_db' }); // Deselect the other
        } else if (purposeId === 'create_smart_db' && selectedPurposes.has('import_spreadsheet')) {
            dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: 'import_spreadsheet' }); // Deselect the other
        }
    }
  };

  const handleCustomPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_CUSTOM_PHONE_NUMBER', payload: e.target.value });
  };

  const showCustomPhoneInput = selectedPlan === 'business_270' && !isReconfiguring;

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Define tu Asistente</CardTitle>
        <CardDescription>Dale un nombre a tu asistente y selecciona qué debería hacer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="assistantName" className="text-base">Nombre del Asistente</Label>
          <Input
            id="assistantName"
            type="text"
            placeholder="Ej: Mi Ayudante de Ventas"
            value={assistantName}
            onChange={handleNameChange}
            className="text-base"
            aria-required="true"
          />
        </div>

        {showCustomPhoneInput && (
          <div className="space-y-2">
            <Label htmlFor="customPhoneNumber" className="text-base flex items-center gap-2">
              <FaPhone /> Número de Teléfono del Asistente (Plan de Negocios)
            </Label>
            <Input
              id="customPhoneNumber"
              type="tel"
              placeholder="Ej: +12345678900"
              value={customPhoneNumber || ''}
              onChange={handleCustomPhoneChange}
              className="text-base"
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground">
              Ingresa el número de teléfono que este asistente utilizará.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-base block mb-2">Propósitos del Asistente</Label>
          {assistantPurposesConfig.map((purpose) => {
            const Icon = purpose.icon;
            const isChecked = selectedPurposes.has(purpose.id);
            // Determine if this option should be disabled due to mutual exclusion
            let isDisabled = false;
            if (purpose.id === 'import_spreadsheet' && selectedPurposes.has('create_smart_db')) {
              // Cannot select import_spreadsheet if create_smart_db is already selected (unless it's itself)
              // This logic is handled by the toggle now.
            } else if (purpose.id === 'create_smart_db' && selectedPurposes.has('import_spreadsheet')) {
              // Cannot select create_smart_db if import_spreadsheet is already selected (unless it's itself)
            }
            
            return (
              <div 
                key={purpose.id} 
                className={`flex items-start space-x-3 p-3 border rounded-md transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/20' : 'hover:bg-muted/50 cursor-pointer'
                }`}
                onClick={() => !isDisabled && handlePurposeToggle(purpose.id)}
              >
                <Checkbox
                  id={`purpose-${purpose.id}`}
                  checked={isChecked}
                  onCheckedChange={() => !isDisabled && handlePurposeToggle(purpose.id)}
                  aria-labelledby={`purpose-label-${purpose.id}`}
                  className="mt-1"
                  disabled={isDisabled}
                />
                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5" />}
                <div className="flex-1">
                  <Label 
                    htmlFor={`purpose-${purpose.id}`} 
                    id={`purpose-label-${purpose.id}`} 
                    className={`font-medium text-sm ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {purpose.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">{purpose.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Step1AssistantDetails;

