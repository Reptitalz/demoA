
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaWhatsapp, FaEnvelope, FaKey } from 'react-icons/fa';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber, type E164Number } from 'react-phone-number-input';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog = ({ isOpen, onOpenChange }: ForgotPasswordDialogProps) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecovery = async (method: 'whatsapp' | 'email') => {
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      toast({
        title: "Número de Teléfono Inválido",
        description: "Por favor, ingresa el número de teléfono asociado a tu cuenta.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/auth/request-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, method }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar la recuperación.');
      }
      
      toast({
        title: "Solicitud Enviada",
        description: `Si tu número está registrado, recibirás las instrucciones por ${method === 'whatsapp' ? 'WhatsApp' : 'correo electrónico'}.`,
      });

      onOpenChange(false);

    } catch (error: any) {
        toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaKey /> Recuperar Contraseña
          </DialogTitle>
          <DialogDescription>
            Ingresa tu número de teléfono para enviarte un enlace de recuperación.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-phone-number">
              Número de teléfono de tu cuenta
            </Label>
            <PhoneInput
              id="recovery-phone-number"
              placeholder="+52 123 456 7890"
              value={phoneNumber}
              onChange={(value) => setPhoneNumber(value)}
              disabled={isProcessing}
              defaultCountry="MX"
            />
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">Elige un método de recuperación:</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                    onClick={() => handleRecovery('whatsapp')}
                    disabled={isProcessing || !phoneNumber}
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white"
                >
                    {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : <FaWhatsapp className="mr-2" />}
                    Enviar por WhatsApp
                </Button>
                <Button
                    disabled={true}
                    className="w-full sm:w-auto"
                    title="Próximamente"
                >
                    <FaEnvelope className="mr-2" />
                    Enviar por Correo (Próximamente)
                </Button>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
                El correo se enviará a la dirección asociada a tu cuenta.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
