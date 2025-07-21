
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface CountdownDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CountdownDialog = ({ isOpen, onOpenChange }: CountdownDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="text-primary" />
            ¡El Lanzamiento se Acerca!
          </DialogTitle>
          <DialogDescription className="pt-2">
            El contador marca el inicio de nuestro servicio de recargas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 text-sm text-foreground">
            <p>
                A partir de la fecha indicada, podrás adquirir créditos para activar y potenciar las funcionalidades de tu asistente virtual.
            </p>
            <p className="font-semibold">
                Mientras tanto, puedes registrarte sin costo alguno, configurar tu primer asistente y dejar todo listo para el gran día.
            </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            ¡Entendido!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CountdownDialog;
