
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaMobileAlt, FaKey } from 'react-icons/fa';
import { auth } from '@/lib/firebase';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber, type E164Number } from 'react-phone-number-input';

interface PhoneNumberSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: string;
  assistantName: string;
}

const PhoneNumberSetupDialog = ({ isOpen, onOpenChange, assistantId, assistantName }: PhoneNumberSetupDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Effect to reset state when dialog opens or assistant changes
  useEffect(() => {
    if (isOpen) {
      const assistant = state.userProfile.assistants.find(a => a.id === assistantId);
      // If phone is already linked but not ready, start at step 2.
      if (assistant?.phoneLinked && assistant.numberReady === false) {
        setPhoneNumber(assistant.phoneLinked);
        setStep(2);
      } else {
        // Otherwise, reset to step 1
        setStep(1);
        setPhoneNumber(assistant?.phoneLinked || '');
        setVerificationCode('');
      }
    }
  }, [isOpen, assistantId, state.userProfile.assistants]);
  
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleRequestCode = () => {
    if (!phoneNumber.trim() || !isValidPhoneNumber(phoneNumber)) {
      toast({
        title: "Número de Teléfono Inválido",
        description: "Por favor, ingresa un número de teléfono válido con su código de país.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    // Simulate API call to send code
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
      toast({ title: "Código Enviado", description: `Hemos enviado un código SMS de verificación a ${phoneNumber}.` });
    }, 1500);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
        toast({ title: "Código Inválido", description: "Por favor, ingresa el código de 6 dígitos.", variant: "destructive" });
        return;
    }
    setIsProcessing(true);

    // Optimistically update the UI, now including the verification code.
    const updatedAssistants = state.userProfile.assistants.map(asst => 
        asst.id === assistantId ? { ...asst, phoneLinked: phoneNumber, verificationCode: verificationCode, numberReady: false } : asst
    );
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: updatedAssistants } });
    
    handleClose();
    toast({
        title: "Procesando Activación...",
        description: `Tu asistente se está activando. Recibirás una notificación cuando esté listo.`,
        duration: 10000,
    });

    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("No autenticado.");

        const response = await fetch('/api/assistants/update-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ assistantId, phoneNumber, verificationCode })
        });
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: "Ocurrió un error al iniciar la activación." }));
            throw new Error(errorData.message || "No se pudo iniciar el proceso de activación.");
        }
        
    } catch (error: any) {
        toast({ title: "Error de Activación", description: error.message, variant: "destructive" });
        
        const originalAssistant = state.userProfile.assistants.find(a => a.id === assistantId);
        if (originalAssistant) {
             dispatch({ type: 'UPDATE_ASSISTANT', payload: { ...originalAssistant, numberReady: undefined, verificationCode: undefined } });
        }
    } finally {
        setIsProcessing(false);
    }
  };


  const handleResendCode = () => {
    setIsProcessing(true);
    // Simulate API call to resend
    setTimeout(() => {
      setIsProcessing(false);
      toast({ title: "Código Reenviado", description: `Hemos reenviado el código a ${phoneNumber}.` });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Integrar Número de Teléfono</DialogTitle>
          <DialogDescription>
            Vincula un número de WhatsApp a tu asistente "{assistantName}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            {step === 1 && (
                <div className="animate-fadeIn space-y-3">
                    <h3 className="font-semibold text-sm">Paso 1: Ingresa tu número</h3>
                    <div className="space-y-2">
                        <Label htmlFor="phone-number" className="flex items-center gap-2">
                        <FaMobileAlt /> Número de Teléfono de WhatsApp
                        </Label>
                        <PhoneInput
                          id="phone-number"
                          placeholder="Ingresa tu número de teléfono"
                          value={phoneNumber as E164Number | undefined}
                          onChange={(value) => setPhoneNumber(value || '')}
                          defaultCountry="MX"
                          disabled={isProcessing}
                        />
                        <p className="text-xs text-muted-foreground">
                        Debe ser un número válido que pueda recibir mensajes de WhatsApp.
                        </p>
                    </div>
                </div>
            )}
            {step === 2 && (
                 <div className="animate-fadeIn space-y-3">
                    <h3 className="font-semibold text-sm">Paso 2: Confirma el código</h3>
                    <div className="space-y-2">
                        <Label htmlFor="verification-code" className="flex items-center gap-2">
                            <FaKey /> Código de Verificación
                        </Label>
                        <Input
                        id="verification-code"
                        placeholder="******"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={isProcessing}
                        maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">
                            El código llegará a tu teléfono en unos minutos. Si no lo recibes, puedes reenviarlo.
                        </p>
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
            {step === 1 && (
                 <Button onClick={handleRequestCode} disabled={isProcessing || !isValidPhoneNumber(phoneNumber || '')}>
                    {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Enviar Código
                </Button>
            )}
            {step === 2 && (
                <div className="w-full flex justify-between gap-2">
                    <Button variant="outline" onClick={handleResendCode} disabled={isProcessing}>
                        Reenviar
                    </Button>
                    <Button onClick={handleVerifyCode} disabled={isProcessing || verificationCode.length !== 6}>
                        {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                        Verificar Número
                    </Button>
                </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberSetupDialog;
