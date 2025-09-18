// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddChatDialog = ({ isOpen, onOpenChange }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleStartChat = () => {
    if (!chatPath.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa el ID del chat del asistente.",
        variant: "destructive",
      });
      return;
    }
    onOpenChange(false);
    // Navigate to the chat page using the provided path
    router.push(`/chat/${chatPath.trim()}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus /> Iniciar un Nuevo Chat
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de chat (chat path) del asistente con el que quieres conversar.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="chatPath">ID de Chat del Asistente</Label>
          <Input
            id="chatPath"
            placeholder="ejemplo-asistente-abc12"
            value={chatPath}
            onChange={(e) => setChatPath(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleStartChat}>Iniciar Chat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
