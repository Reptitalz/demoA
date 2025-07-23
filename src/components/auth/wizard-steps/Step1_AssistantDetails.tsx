"use client";

import { useApp } from "@/providers/AppProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assistantPurposesConfig } from "@/config/appConfig";
import type { AssistantPurposeType } from "@/types";
import { FaWhatsapp, FaCheckCircle } from "react-icons/fa";
import { PhoneInput } from "@/components/ui/phone-input";
import type { E164Number } from "react-phone-number-input";

const Step1AssistantDetails = () => {
  const { state, dispatch } = useApp();
  const { assistantName, selectedPurposes, ownerPhoneNumberForNotifications } = state.wizard;

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
    <Card className="w-full shadow-none border-none animate-fadeIn">
      <CardHeader className="p-0 mb-6">
        <CardTitle>Define tu Asistente</CardTitle>
        <CardDescription>Dale un nombre a tu asistente y selecciona qué debería hacer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
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

        {selectedPurposes.has('notify_owner') && (
          <div className="space-y-2 animate-fadeIn">
            <Label htmlFor="ownerPhoneNumber" className="text-base flex items-center gap-2">
              <FaWhatsapp className="text-green-500" /> Tu WhatsApp para notificaciones
            </Label>
            <PhoneInput
              id="ownerPhoneNumber"
              placeholder="Ingresa tu número de teléfono"
              value={ownerPhoneNumberForNotifications as E164Number | undefined}
              onChange={handleOwnerPhoneChange}
              defaultCountry="MX"
            />
            <p className="text-xs text-muted-foreground">
              El asistente te notificará a este número cuando esté listo o requiera tu ayuda.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-base block mb-2">Propósitos del Asistente</Label>
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
                className={`flex items-start space-x-3 p-3 border rounded-md transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/20' : 'hover:bg-muted/50 cursor-pointer'
                } ${
                  isChecked ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => !isDisabled && handlePurposeToggle(purpose.id)}
              >
                {isChecked 
                  ? <FaCheckCircle className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                  : <div className="h-5 w-5 border-2 border-muted rounded-full mt-1 shrink-0" />
                }
                
                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5" />}
                <div className="flex-1">
                  <Label 
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
