
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaMobileAlt, FaKey, FaCheckCircle } from 'react-icons/fa';
import { auth } from '@/lib/firebase';

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

  useEffect(() => {
    if (isOpen) {
      const assistant = state.userProfile.assistants.find(a => a.id === assistantId);
      if (assistant?.phoneLinked && !assistant.numberReady) {
        setPhoneNumber(assistant.phoneLinked);
        setStep(2); // Skip to step 2 if phone is linked but not ready
      } else {
        setStep(1);
        setPhoneNumber('');
        setVerificationCode('');
      }
    }
  }, [isOpen, assistantId, state.userProfile.assistants]);

  const handleRequestCode = () => {
    if (!phoneNumber.trim() || !/^\+\d{10,15}$/.test(phoneNumber)) {
      toast({
        title: "Número de Teléfono Inválido",
        description: "Por favor, ingresa un número válido en formato internacional (ej: +521234567890).",
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

    try {
        // 1. Dispatch local state change to show pending status immediately
        const updatedAssistants = state.userProfile.assistants.map(asst => 
            asst.id === assistantId ? { ...asst, phoneLinked: phoneNumber, numberReady: false } : asst
        );
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: updatedAssistants } });
        setStep(3); // Move to the "pending" view
        
        // 2. Make the API call to the backend to start the real process
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
            // The backend process failed to start, so we should revert the UI change.
            throw new Error("No se pudo iniciar el proceso de activación.");
        }
        
        toast({
            title: "Procesando Activación...",
            description: `Se está activando tu asistente. Recibirás una notificación cuando esté listo.`,
            duration: 10000,
        });

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        // Revert UI change on error
        const revertedAssistants = state.userProfile.assistants.map(asst => 
            asst.id === assistantId ? { ...asst, numberReady: undefined } : asst
        );
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: revertedAssistants } });
        setIsProcessing(false);
        setStep(2); // Go back to the verification step on error
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

  const handleClose = () => {
    if (isProcessing && step !== 3) return;
    onOpenChange(false);
    setTimeout(() => {
        setStep(1);
        setPhoneNumber('');
        setVerificationCode('');
        setIsProcessing(false);
    }, 300);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Integrar Número de Teléfono</DialogTitle>
          <DialogDescription>
            {step < 3 
              ? `Vincula un número de WhatsApp a tu asistente "${assistantName}".` 
              : "Proceso de activación iniciado."
            }
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
                        <Input
                        id="phone-number"
                        placeholder="+521234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isProcessing}
                        />
                        <p className="text-xs text-muted-foreground">
                        Debe ser un número válido en formato internacional que pueda recibir mensajes de WhatsApp.
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
            {step === 3 && (
                <div className="animate-fadeIn text-center flex flex-col items-center gap-3">
                    <FaSpinner className="h-12 w-12 text-primary animate-spin" />
                    <h3 className="font-semibold text-base">Activación en Proceso...</h3>
                     <p className="text-sm text-muted-foreground">
                        El asistente <strong className="text-foreground">{assistantName}</strong> se está activando con el número <strong className="text-foreground">{phoneNumber}</strong>.
                        Este proceso puede tardar hasta 10 minutos. Recibirás una notificación cuando esté listo.
                    </p>
                </div>
            )}
        </div>
        <DialogFooter>
            {step === 1 && (
                 <Button onClick={handleRequestCode} disabled={isProcessing || !phoneNumber.trim()}>
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
            {step === 3 && (
                <Button onClick={handleClose} className="w-full">
                    Cerrar
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberSetupDialog;
