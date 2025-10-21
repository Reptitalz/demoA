
"use client";

import { useApp } from "@/providers/AppProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assistantPurposesConfig } from "@/config/appConfig";
import type { AssistantPurposeType } from "@/types";
import { FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import React from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

const Step1AssistantDetails = () => {
  const { state, dispatch } = useApp();
  const { assistantName, selectedPurposes, ownerPhoneNumberForNotifications } = state.wizard;
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: e.target.value });
  };

  const handlePurposeToggle = (purposeId: AssistantPurposeType) => {
    dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId });
  };

  const handleOwnerPhoneChange = (value: string) => {
    dispatch({ type: 'UPDATE_OWNER_PHONE_NUMBER', payload: value });
  };

  const availablePurposes = assistantPurposesConfig;
  const showOwnerPhoneInput = selectedPurposes.has('notify_owner');

  return (
    <div className="w-full animate-fadeIn space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Define tu Asistente</h3>
        <p className="text-sm text-muted-foreground">Dale un nombre y elige sus tareas principales.</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="assistantName" className="text-base font-medium">Nombre del Asistente</Label>
          <Input
            id="assistantName"
            type="text"
            placeholder="Ej: Mi Ayudante de Ventas"
            value={assistantName}
            onChange={handleNameChange}
            className="text-base py-6"
            aria-required="true"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium block">Propósitos del Asistente</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePurposes.map((purpose) => {
              const Icon = purpose.icon;
              const isChecked = selectedPurposes.has(purpose.id);
              
              let isDisabled = false;
              if (purpose.id === 'import_spreadsheet' && selectedPurposes.has('create_smart_db')) {
                isDisabled = true;
              } else if (purpose.id === 'create_smart_db' && selectedPurposes.has('import_spreadsheet')) {
                isDisabled = true;
              }
              
              return (
                <div 
                  key={purpose.id} 
                  className={cn(
                    "flex items-start space-x-4 p-4 border rounded-lg transition-all duration-200 relative",
                    isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/40' : 'hover:bg-muted/50 cursor-pointer hover:shadow-md hover:border-green-500/50',
                    isChecked ? 'border-green-500 bg-green-500/10 shadow-lg' : 'bg-card'
                  )}
                  onClick={() => !isDisabled && handlePurposeToggle(purpose.id)}
                >
                  {isChecked 
                    ? <FaCheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-500 shrink-0" />
                    : <FaRegCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground/50 shrink-0" />
                  }
                  
                  {Icon && <Icon className="h-8 w-8 text-green-500 mt-1" />}
                  <div className="flex-1 pr-4">
                    <Label className={cn("font-semibold text-sm", isDisabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
                      {purpose.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{purpose.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {showOwnerPhoneInput && (
              <div className="space-y-2 pt-4 animate-fadeIn">
                <Label htmlFor="ownerPhone" className="text-base font-medium">
                  Tu Número de WhatsApp para Notificaciones
                </Label>
                <PhoneInput
                    id="ownerPhone"
                    placeholder="Ingresa tu número de WhatsApp"
                    value={ownerPhoneNumberForNotifications as any}
                    onChange={(value) => handleOwnerPhoneChange(value || '')}
                    defaultCountry="MX"
                    aria-required="true"
                />
                 <p className="text-xs text-muted-foreground pt-1">
                  Tu asistente usará este número para enviarte alertas importantes.
                </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step1AssistantDetails;
