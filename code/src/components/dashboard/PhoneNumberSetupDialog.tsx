
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaPhoneAlt } from 'react-icons/fa';

interface PhoneNumberSetupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: string;
  assistantName: string;
}

const PhoneNumberSetupDialog = ({ isOpen, onOpenChange, assistantId, assistantName }: PhoneNumberSetupDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLinkNumber = () => {
    if (!phoneNumber.trim() || !/^\+\d{10,15}$/.test(phoneNumber)) {
      toast({
        title: "Número de Teléfono Inválido",
        description: "Por favor, ingresa un número de teléfono válido en formato internacional (ej: +521234567890).",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    // Simulate API call to link number
    setTimeout(() => {
      const assistantToUpdate = state.userProfile.assistants.find(a => a.id === assistantId);
      if (assistantToUpdate) {
        const updatedAssistant = { ...assistantToUpdate, phoneLinked: phoneNumber };
        dispatch({ type: 'UPDATE_ASSISTANT', payload: updatedAssistant });
        
        toast({
          title: "¡Número Vinculado!",
          description: `El asistente ${assistantName} ahora está activo con el número ${phoneNumber}.`,
        });

        setIsProcessing(false);
        onOpenChange(false); // Close the dialog on success
      } else {
        toast({ title: "Error", description: "No se encontró el asistente a actualizar.", variant: "destructive" });
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
        setPhoneNumber('');
    }, 300);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Integrar Número de Teléfono</DialogTitle>
          <DialogDescription>
            Vincula un número de WhatsApp a tu asistente "{assistantName}".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number" className="flex items-center gap-2">
              <FaPhoneAlt /> Número de Teléfono de WhatsApp
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLinkNumber}
            disabled={isProcessing || !phoneNumber.trim()}
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin mr-2 h-4 w-4" /> Vinculando...
              </>
            ) : (
              'Vincular Número'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneNumberSetupDialog;
