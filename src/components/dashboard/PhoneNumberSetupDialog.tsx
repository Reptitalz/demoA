
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaMobileAlt, FaKey, FaCheckCircle } from 'react-icons/fa';
import type { AssistantConfig } from '@/types';

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
  const [isVerifying, setIsVerifying] = useState(false);

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

  const handleNextStep = () => {
    if (step === 1) {
      if (!phoneNumber.trim() || !/^\+\d{10,15}$/.test(phoneNumber)) {
        toast({
          title: "Número de Teléfono Inválido",
          description: "Por favor, ingresa un número válido en formato internacional (ej: +521234567890).",
          variant: "destructive",
        });
        return;
      }
      setIsVerifying(true);
      // Simulate API call to send code
      setTimeout(() => {
        setIsVerifying(false);
        setStep(2);
        toast({ title: "Código Enviado", description: `Hemos enviado un código SMS de verificación a ${phoneNumber}.` });
      }, 1500);
    } else if (step === 2) {
      if (!verificationCode.trim() || verificationCode.length !== 6) {
        toast({ title: "Código Inválido", description: "Por favor, ingresa el código de 6 dígitos.", variant: "destructive" });
        return;
      }
      setIsVerifying(true);
      // Simulate API call to verify code
      setTimeout(() => {
        const assistantExists = state.userProfile.assistants.some(a => a.id === assistantId);
        if (assistantExists) {
          const updatedAssistants = state.userProfile.assistants.map(asst => {
            if (asst.id === assistantId) {
                return {
                    ...asst,
                    phoneLinked: phoneNumber, 
                    verificationCode: verificationCode,
                    numberReady: false // Set to false, an external process will set it to true
                };
            }
            return asst;
          });

          dispatch({ type: 'UPDATE_USER_PROFILE', payload: { assistants: updatedAssistants } });
          
          setIsVerifying(false);
          setStep(3);
          toast({
            title: "¡Verificación Exitosa!",
            description: `El número ${phoneNumber} ha sido vinculado a ${assistantName}. La activación está en proceso.`,
          });
        } else {
            toast({ title: "Error", description: "No se encontró el asistente a actualizar.", variant: "destructive" });
            setIsVerifying(false);
        }
      }, 1500);
    }
  };

  const handleResendCode = () => {
    setIsVerifying(true);
    // Simulate API call to resend
    setTimeout(() => {
      setIsVerifying(false);
      toast({ title: "Código Reenviado", description: `Hemos reenviado el código a ${phoneNumber}.` });
    }, 2000);
  };

  const handleClose = () => {
    if (isVerifying) return;
    onOpenChange(false);
    // Reset state after dialog closes to ensure a fresh start next time
    setTimeout(() => {
        setStep(1);
        setPhoneNumber('');
        setVerificationCode('');
        setIsVerifying(false);
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
              : "Proceso completado."
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
                        disabled={isVerifying}
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
                        disabled={isVerifying}
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
                    <FaCheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="font-semibold text-base">¡Número Vinculado!</h3>
                     <p className="text-sm text-muted-foreground">
                        El asistente <strong className="text-foreground">{assistantName}</strong> se está activando con el número <strong className="text-foreground">{phoneNumber}</strong>.
                        Este proceso puede tardar hasta 10 minutos. Te notificaremos cuando esté listo para usarse.
                    </p>
                </div>
            )}
        </div>
        <DialogFooter>
            {step === 1 && (
                 <Button onClick={handleNextStep} disabled={isVerifying || !phoneNumber.trim()}>
                    {isVerifying ? <FaSpinner className="animate-spin mr-2" /> : null}
                    Enviar Código
                </Button>
            )}
            {step === 2 && (
                <div className="w-full flex justify-between gap-2">
                    <Button variant="outline" onClick={handleResendCode} disabled={isVerifying}>
                        Reenviar
                    </Button>
                    <Button onClick={handleNextStep} disabled={isVerifying || verificationCode.length !== 6}>
                        {isVerifying ? <FaSpinner className="animate-spin mr-2" /> : null}
                        Verificar Número
                    </Button>
                </div>
            )}
            {step === 3 && (
                <Button onClick={handleClose} className="w-full">
                    Finalizar
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberSetupDialog;
