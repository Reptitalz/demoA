
"use client";

import { useApp } from "@/providers/AppProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assistantPurposesConfig } from "@/config/appConfig";
import type { AssistantPurposeType } from "@/types";
import { FaWhatsapp } from "react-icons/fa";

const Step1AssistantDetails = () => {
  const { state, dispatch } = useApp();
  const { assistantName, selectedPurposes, ownerPhoneNumberForNotifications } = state.wizard;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_ASSISTANT_NAME', payload: e.target.value });
  };

  const handlePurposeToggle = (purposeId: AssistantPurposeType) => {
    dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId });
  };

  const handleOwnerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_OWNER_PHONE_NUMBER', payload: e.target.value });
  };

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

        {selectedPurposes.has('notify_owner') && (
          <div className="space-y-2 animate-fadeIn">
            <Label htmlFor="ownerPhoneNumber" className="text-base flex items-center gap-2">
              <FaWhatsapp className="text-green-500" /> Tu WhatsApp para notificaciones
            </Label>
            <Input
              id="ownerPhoneNumber"
              type="tel"
              placeholder="Ej: +521234567890"
              value={ownerPhoneNumberForNotifications}
              onChange={handleOwnerPhoneChange}
              className="text-base"
              aria-required="true"
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
