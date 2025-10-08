
// src/components/dashboard/HelpDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaQuestionCircle } from 'react-icons/fa';

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpDialog = ({ isOpen, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaQuestionCircle /> Centro de Ayuda
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-muted-foreground">
            <p>Si necesitas asistencia, tienes alguna pregunta o quieres reportar un problema, no dudes en contactarnos.</p>
            <p>Nuestro equipo de soporte está disponible para ayudarte.</p>
            <p className="font-semibold text-foreground">Email de Soporte: <a href="mailto:contacto@heymanito.com" className="text-primary underline">contacto@heymanito.com</a></p>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
