
"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FaSpinner, FaWhatsapp, FaMobileAlt, FaKey, FaCheckCircle } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PhoneNumberSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistantName: string;
}

const PhoneNumberSetupDialog = ({ isOpen, onOpenChange, assistantName }: PhoneNumberSetupDialogProps) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleNextStep = () => {
      if (step === 1) {
          // Here you would normally trigger an API call to send an SMS
          // For now, we just move to the next step
          if (!phoneNumber.trim() || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
              toast({ title: "Número Inválido", description: "Por favor, ingresa un número válido en formato internacional (ej: +1234567890).", variant: "destructive" });
              return;
          }
          setIsVerifying(true);
          setTimeout(() => { // Simulate API call
              setIsVerifying(false);
              setStep(2);
              toast({ title: "Código Enviado", description: `Hemos enviado un código de verificación a ${phoneNumber}.` });
          }, 1500);
      } else if (step === 2) {
          // Here you would verify the code via an API call
           if (!verificationCode.trim() || verificationCode.length < 6) {
              toast({ title: "Código Inválido", description: "Por favor, ingresa el código de 6 dígitos que recibiste.", variant: "destructive" });
              return;
          }
          setIsVerifying(true);
          setTimeout(() => { // Simulate API call
              setIsVerifying(false);
              setStep(3);
              toast({ title: "¡Verificación Exitosa!", description: "Tu número ha sido vinculado correctamente." });
          }, 1500);
      }
  };
  
  const handleResendCode = () => {
    setIsVerifying(true);
    setTimeout(() => { // Simulate API call
      setIsVerifying(false);
      toast({ title: "Código Reenviado", description: `Hemos reenviado un código a ${phoneNumber}.` });
    }, 1500);
  }

  const handleClose = () => {
    onOpenChange(false);
    // Reset state on close after a small delay to allow animation out
    setTimeout(() => {
        setStep(1);
        setPhoneNumber('');
        setVerificationCode('');
        setIsVerifying(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurar Número para {assistantName}</DialogTitle>
          <DialogDescription>Sigue estos pasos para vincular tu número de teléfono.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          {step === 1 && (
            <div className="animate-fadeIn space-y-4">
              <h3 className="font-semibold">Paso 1: Proporciona tu número</h3>
              <p className="text-sm text-muted-foreground">
                Consigue un SIM físico de cualquier compañía. <strong className="text-foreground">Importante:</strong> no debe estar vinculado a ninguna cuenta de WhatsApp. No necesita saldo, solo la capacidad de recibir mensajes SMS para la verificación.
              </p>
              <div className="space-y-2">
                <Label htmlFor="phone-number" className="flex items-center gap-2"><FaMobileAlt /> Número de Teléfono</Label>
                <Input
                  id="phone-number"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
            </div>
          )}
          {step === 2 && (
             <div className="animate-fadeIn space-y-4">
              <h3 className="font-semibold">Paso 2: Ingresa el código de verificación</h3>
              <p className="text-sm text-muted-foreground">
                Hemos enviado un código SMS a <strong className="text-foreground">{phoneNumber}</strong>. Por favor, ingrésalo a continuación. El envío puede tardar hasta 2 minutos.
              </p>
              <div className="space-y-2">
                <Label htmlFor="verification-code" className="flex items-center gap-2"><FaKey /> Código de Verificación</Label>
                <Input
                  id="verification-code"
                  placeholder="******"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isVerifying}
                  maxLength={6}
                />
              </div>
            </div>
          )}
          {step === 3 && (
             <div className="animate-fadeIn space-y-4 text-center">
                <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">¡Número Vinculado Exitosamente!</h3>
                <p className="text-sm text-muted-foreground">
                    El asistente <strong className="text-foreground">{assistantName}</strong> ahora está asociado con el número <strong className="text-foreground">{phoneNumber}</strong>. Tu asistente se está activando y estará listo en breve.
                </p>
             </div>
          )}
        </div>
        <DialogFooter>
            {step === 1 && (
                <Button onClick={handleNextStep} disabled={isVerifying}>
                    {isVerifying && <FaSpinner className="animate-spin mr-2" />}
                    Enviar Código de Verificación
                </Button>
            )}
             {step === 2 && (
                <div className="w-full flex justify-between">
                    <Button variant="outline" onClick={handleResendCode} disabled={isVerifying}>
                       {isVerifying && <FaSpinner className="animate-spin mr-2" />}
                        Reenviar Código
                    </Button>
                    <Button onClick={handleNextStep} disabled={isVerifying}>
                        {isVerifying && <FaSpinner className="animate-spin mr-2" />}
                        Verificar y Vincular
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
