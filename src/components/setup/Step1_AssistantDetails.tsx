
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
    dispatch({ type: 'TOGGLE_ASSISTANT_PURPOSE', payload: purposeId });
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
            return (
              <div key={purpose.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handlePurposeToggle(purpose.id)}>
                <Checkbox
                  id={`purpose-${purpose.id}`}
                  checked={selectedPurposes.has(purpose.id)}
                  onCheckedChange={() => handlePurposeToggle(purpose.id)}
                  aria-labelledby={`purpose-label-${purpose.id}`}
                  className="mt-1"
                />
                {Icon && <Icon className="h-5 w-5 text-primary mt-0.5" />}
                <div className="flex-1">
                  <Label htmlFor={`purpose-${purpose.id}`} id={`purpose-label-${purpose.id}`} className="font-medium cursor-pointer text-sm">{purpose.name}</Label>
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
