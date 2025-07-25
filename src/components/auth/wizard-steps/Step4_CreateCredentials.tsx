"use client";

import React, { useState } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import type { E164Number } from 'react-phone-number-input';
import { Key, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getPasswordStrength = (password: string): { level: 'none' | 'weak' | 'moderate' | 'strong'; text: string } => {
  if (!password) return { level: 'none', text: '' };
  
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  
  if (password.length < 6) return { level: 'weak', text: 'Débil' };
  if (password.length >= 8 && hasNumber && (hasUpper || hasLower)) return { level: 'strong', text: 'Fuerte' };
  if (password.length >= 6 && (hasNumber || hasUpper)) return { level: 'moderate', text: 'Moderada' };
  
  return { level: 'weak', text: 'Débil' };
};


const Step4CreateCredentials = () => {
  const { state, dispatch } = useApp();
  const { phoneNumber, password, confirmPassword, verificationCode } = state.wizard;
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordStrength = getPasswordStrength(password || '');

  const handlePhoneChange = (value: E164Number | undefined) => {
    dispatch({ type: 'SET_WIZARD_PHONE_NUMBER', payload: value || '' });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_PASSWORD', payload: e.target.value });
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_CONFIRM_PASSWORD', payload: e.target.value });
  };
  
  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_VERIFICATION_CODE', payload: e.target.value });
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
        
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Código de Verificación
          </Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Revisa tu WhatsApp"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground pt-1">
            Recibirás un código en el número de WhatsApp que proporcionaste para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" /> Crea una Contraseña Segura
          </Label>
          <div className="relative">
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
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
          </div>
        </div>

        {passwordStrength.level !== 'none' && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex justify-between items-center">
                <p className="text-xs font-medium">Seguridad de la contraseña:</p>
                <p className={cn(
                    "text-xs font-semibold",
                    passwordStrength.level === 'weak' && "text-red-500",
                    passwordStrength.level === 'moderate' && "text-yellow-500",
                    passwordStrength.level === 'strong' && "text-green-500",
                )}>{passwordStrength.text}</p>
            </div>
            <div className="flex gap-1.5">
                <div className={cn("h-1.5 flex-1 rounded-full", passwordStrength.level === 'weak' ? "bg-red-500" : "bg-muted")} />
                <div className={cn("h-1.5 flex-1 rounded-full", passwordStrength.level === 'moderate' ? "bg-yellow-500" : (passwordStrength.level === 'strong' ? "bg-green-500" : "bg-muted"))} />
                <div className={cn("h-1.5 flex-1 rounded-full", passwordStrength.level === 'strong' ? "bg-green-500" : "bg-muted")} />
            </div>
             <p className="text-xs text-muted-foreground pt-1">
              Este medidor es solo una guía. No es obligatorio crear una contraseña "fuerte".
            </p>
          </div>
        )}

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
            disabled={!password}
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
