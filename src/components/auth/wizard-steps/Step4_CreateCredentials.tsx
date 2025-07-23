"use client";

import React from 'react';
import { useApp } from "@/providers/AppProvider";
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
    <div className="w-full animate-fadeIn space-y-6">
       <div className="text-center">
        <h3 className="text-xl font-semibold">Crea tus Credenciales de Acceso</h3>
        <p className="text-sm text-muted-foreground">
          Establece tu número de teléfono y contraseña para iniciar sesión más tarde.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-base font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" /> Tu Número de Teléfono
          </Label>
          <PhoneInput
            id="phone-number"
            placeholder="Tu número para iniciar sesión"
            value={phoneNumber as E164Number | undefined}
            onChange={handlePhoneChange}
            defaultCountry="MX"
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground pt-1">
            Este será tu nombre de usuario para acceder a la plataforma.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-medium flex items-center gap-2">
            <Key className="h-4 w-4" /> Crea una Contraseña Segura
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={handlePasswordChange}
            className="text-base py-6"
            aria-required="true"
          />
           <p className="text-xs text-muted-foreground pt-1">
              Asegúrate de que sea segura y fácil de recordar.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Step4CreateCredentials;
