
"use client";

import React, { useState } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { sendVerificationCodeWebhook } from '@/services/verificationWebhookService';

interface Step5VerificationProps {
  verificationKey: string;
}

const Step5Verification = ({ verificationKey }: Step5VerificationProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { verificationCode, phoneNumber } = state.wizard;
  const [isResending, setIsResending] = useState(false);

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_WIZARD_VERIFICATION_CODE', payload: e.target.value });
  };
  
  const handleResendCode = async () => {
    if (!phoneNumber || !verificationKey) {
        toast({ title: "Error", description: "Falta información para reenviar el código.", variant: "destructive" });
        return;
    }
    setIsResending(true);
    try {
        await sendVerificationCodeWebhook(phoneNumber, verificationKey);
        toast({ title: "Código Reenviado", description: "Se ha enviado un nuevo código de verificación." });
    } catch (error) {
        toast({ title: "Error", description: "No se pudo reenviar el código.", variant: "destructive" });
    } finally {
        setIsResending(false);
    }
  };

  return (
    <div className="w-full animate-fadeIn space-y-4">
       <div className="text-center">
        <h3 className="text-xl font-semibold">Verificación de Seguridad</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa el código que hemos enviado para continuar.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Código de Verificación
          </Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="******"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            aria-required="true"
            maxLength={6}
          />
          <p className="text-xs text-muted-foreground pt-1">
            Revisa tus mensajes. Te hemos enviado el código para confirmar que tienes acceso a este número.
          </p>
        </div>

        <div className="text-center">
            <Button variant="link" size="sm" onClick={handleResendCode} disabled={isResending}>
                {isResending ? "Reenviando..." : "¿No recibiste el código? Reenviar"}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default Step5Verification;
