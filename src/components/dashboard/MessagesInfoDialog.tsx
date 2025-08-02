
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaInfoCircle, FaArrowRight, FaArrowLeft, FaBell } from 'react-icons/fa';

interface MessagesInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessagesInfoDialog = ({ isOpen, onOpenChange }: MessagesInfoDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaInfoCircle /> ¿Cómo se Cuentan los Mensajes?
          </DialogTitle>
          <DialogDescription>
            Cada interacción con tu asistente consume un mensaje de tu saldo. Aquí te explicamos qué cuenta como un mensaje:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FaArrowRight className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-semibold">Cuando tu asistente responde a un cliente.</p>
              <p className="text-xs text-muted-foreground">Cada respuesta enviada por la IA.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FaArrowLeft className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-semibold">Cuando un cliente te envía un mensaje.</p>
              <p className="text-xs text-muted-foreground">Cada mensaje recibido que activa al asistente.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FaBell className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-semibold">Cuando el asistente te envía una notificación.</p>
              <p className="text-xs text-muted-foreground">Alertas que recibes en tu WhatsApp personal.</p>
            </div>
          </div>
           <p className="text-center text-xs text-muted-foreground pt-2">
            Básicamente, cada interacción es un mensaje.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesInfoDialog;
