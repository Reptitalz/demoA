// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddChatDialog = ({ isOpen, onOpenChange }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleAddContact = () => {
    if (!chatPath.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa el ID del chat del contacto.",
        variant: "destructive",
      });
      return;
    }
    // For now, we just show a success message and close the dialog.
    // The chat will appear implicitly when navigated to, or could be added to a local list.
    toast({
        title: "Contacto Agregado",
        description: "El nuevo chat aparecerá en tu lista.",
    });
    onOpenChange(false);
    // router.push(`/chat/${chatPath.trim()}`); // This line is removed to prevent navigation.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Agregar Nuevo Contacto
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de chat (chat path) del contacto que quieres agregar a tu lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2 flex-grow flex flex-col items-center justify-center">
            <div className='w-full max-w-sm'>
              <Label htmlFor="chatPath">ID de Chat del Contacto</Label>
              <Input
                id="chatPath"
                placeholder="ejemplo-asistente-abc12"
                value={chatPath}
                onChange={(e) => setChatPath(e.target.value)}
                className="text-lg py-6"
              />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAddContact}>Agregar Contacto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
