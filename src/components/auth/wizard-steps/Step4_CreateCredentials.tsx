"use client";

import React from 'react';
import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import type { E164Number } from 'react-phone-number-input';
import { Key, Phone } from 'lucide-react';

const Step4CreateCredentials = () => {
  const { state, dispatch } = useApp();
  const { phoneNumber, password } = state.wizard;

  const handlePhoneChange = (value: E164Number | undefined) => {
    dispatch({ type: 'SET_WIZARD_PHONE_NUMBER', payload: value || '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_PASSWORD', payload: e.target.value });
  };

  return (
    <Card className="w-full shadow-none border-none animate-fadeIn">
      <CardHeader className="p-0 mb-6">
        <CardTitle>Crea tus Credenciales</CardTitle>
        <CardDescription>
          Establece tu número de teléfono y contraseña. Los usarás para iniciar sesión más tarde.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-base flex items-center gap-2">
            <Phone /> Tu Número de Teléfono
          </Label>
          <PhoneInput
            id="phone-number"
            placeholder="Tu número para iniciar sesión"
            value={phoneNumber as E164Number | undefined}
            onChange={handlePhoneChange}
            defaultCountry="MX"
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            Este será tu nombre de usuario.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base flex items-center gap-2">
            <Key /> Crea una Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={handlePasswordChange}
            className="text-base"
            aria-required="true"
          />
           <p className="text-xs text-muted-foreground">
              Asegúrate de que sea segura y fácil de recordar.
            </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Step4CreateCredentials;
