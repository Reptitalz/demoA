
"use client";

import { useApp } from "@/providers/AppProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assistantPurposesConfig } from "@/config/appConfig";
import type { AssistantPurposeType } from "@/types";
import { FaWhatsapp, FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { PhoneInput } from "@/components/ui/phone-input";
import type { E164Number } from "react-phone-number-input";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

const Step1AssistantDetails = () => {
  const { state, dispatch } = useApp();
  const { assistantName, selectedPurposes, ownerPhoneNumberForNotifications, editingAssistantId } = state.wizard;
  const { isReconfiguring } = state.wizard;

  // Effect to populate phone number when reconfiguring
  useEffect(() => {
    if (isReconfiguring && editingAssistantId) {
      const assistant = state.userProfile.assistants.find(a => a.id === editingAssistantId);
      if (assistant) {
        const notifyOwnerPurpose = assistant.purposes.find(p => p.startsWith('notify_owner'));
        if (notifyOwnerPurpose) {
          const phone = notifyOwnerPurpose.split(' ')[1];
          if (phone) {
            dispatch({ type: 'UPDATE_OWNER_PHONE_NUMBER', payload: phone });
          }
        }
      }
    }
  }, [isReconfiguring, state.userProfile.assistants, editingAssistantId, dispatch]);


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: e.target.value });
  };

  const handlePurposeToggle = (purposeId: AssistantPurposeType) => {
    dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId });
  };

  const handleOwnerPhoneChange = (value: E164Number | undefined) => {
    dispatch({ type: 'UPDATE_OWNER_PHONE_NUMBER', payload: value || '' });
  };

  return (
    <div className="w-full animate-fadeIn space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Define tu Asistente</h3>
        <p className="text-sm text-muted-foreground">Dale un nombre y elige qué tareas realizará.</p>
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

        {selectedPurposes.has('notify_owner') && (
          <div className="space-y-2 animate-fadeIn bg-muted/30 p-4 rounded-lg">
            <Label htmlFor="ownerPhoneNumber" className="text-base font-medium flex items-center gap-2">
              <FaWhatsapp className="text-green-500" /> Tu WhatsApp para Notificaciones
            </Label>
            <PhoneInput
              id="ownerPhoneNumber"
              placeholder="Ingresa tu número de WhatsApp"
              value={ownerPhoneNumberForNotifications as E164Number | undefined}
              onChange={handleOwnerPhoneChange}
              defaultCountry="MX"
            />
            <p className="text-xs text-muted-foreground">
              El asistente te notificará a este número cuando requiera tu atención.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Label className="text-base font-medium block">Propósitos del Asistente</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assistantPurposesConfig.map((purpose) => {
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
                    isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/40' : 'hover:bg-muted/50 cursor-pointer hover:shadow-md hover:border-primary/50',
                    isChecked ? 'border-primary bg-primary/10 shadow-lg' : 'bg-card'
                  )}
                  onClick={() => !isDisabled && handlePurposeToggle(purpose.id)}
                >
                  {isChecked 
                    ? <FaCheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-500 shrink-0" />
                    : <FaRegCircle className="absolute top-3 right-3 h-5 w-5 text-muted-foreground/50 shrink-0" />
                  }
                  
                  {Icon && <Icon className="h-8 w-8 text-primary mt-1" />}
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
        </div>
      </div>
    </div>
  );
};

export default Step1AssistantDetails;
