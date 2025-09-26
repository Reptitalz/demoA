// src/components/chat/CreateAssistantDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface CreateAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateAssistantDialog = ({ isOpen, onOpenChange }: CreateAssistantDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Crear Asistente
          </DialogTitle>
          <DialogDescription>
            Aquí comenzará el flujo para crear un nuevo asistente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Contenido para la creación del asistente irá aquí.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssistantDialog;
