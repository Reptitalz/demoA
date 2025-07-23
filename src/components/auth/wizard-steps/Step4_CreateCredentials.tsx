"use client";

import React, { useState } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import type { E164Number } from 'react-phone-number-input';
import { Key, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Step4CreateCredentials = () => {
  const { state, dispatch } = useApp();
  const { phoneNumber, password, confirmPassword } = state.wizard;
  const [showPassword, setShowPassword] = useState(false);

  const handlePhoneChange = (value: E164Number | undefined) => {
    dispatch({ type: 'SET_WIZARD_PHONE_NUMBER', payload: value || '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_PASSWORD', payload: e.target.value });
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_CONFIRM_PASSWORD', payload: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  }

  return (
    <div className="w-full animate-fadeIn space-y-4">
       <div className="text-center">
        <h3 className="text-xl font-semibold">Crea tus Credenciales de Acceso</h3>
        <p className="text-sm text-muted-foreground">
          Establece tu número de teléfono y contraseña para iniciar sesión más tarde.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone-number" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" /> Tu Número de Teléfono
          </Label>
          <PhoneInput
            id="phone-number"
            placeholder="Tu número para iniciar sesión"
            value={phoneNumber as E164Number | undefined}
            onChange={handlePhoneChange}
            defaultCountry="MX"
            aria-required="true"
            withCountryCallingCode={true}
          />
          <p className="text-xs text-muted-foreground pt-1">
            Este será tu nombre de usuario para acceder a la plataforma.
          </p>
        </div>

        <div className="space-y-2 relative">
          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" /> Crea una Contraseña Segura
          </Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={handlePasswordChange}
            className="pr-10" // Add padding for the icon
            aria-required="true"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-[27px] h-7 w-7 text-muted-foreground"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" /> Confirma tu Contraseña
          </Label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder="Repite la contraseña"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            aria-required="true"
          />
           <p className="text-xs text-muted-foreground pt-1">
              Asegúrate de que ambas contraseñas coincidan.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Step4CreateCredentials;
