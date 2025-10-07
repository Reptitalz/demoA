// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useContacts } from '@/hooks/useContacts';
import { useRouter } from 'next/navigation';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { useApp } from '@/providers/AppProvider';

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string; // Optional prop to pre-fill the input
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
  const { state } = useApp();
  const { addContact, removeContact } = useContacts();
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (isOpen) {
      setChatPath(initialChatPath);
    }
  }, [isOpen, initialChatPath]);

  const handleAddContact = async () => {
    const trimmedChatPath = chatPath.trim();
    if (!trimmedChatPath) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa el ID del chat del contacto.",
        variant: "destructive",
      });
      return;
    }
    
    // Avoid adding self
    if (state.userProfile.chatPath === trimmedChatPath) {
      toast({
        title: "No puedes agregarte a ti mismo",
        description: "Estás intentando agregar tu propio ID de chat.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    onOpenChange(false); // Close dialog immediately

    try {
      const res = await fetch(`/api/assistants/public?chatPath=${encodeURIComponent(trimmedChatPath)}`);
      
      if (!res.ok) {
        throw new Error('No se encontró ningún usuario con ese ID.');
      }
      
      const data = await res.json();
      const verifiedContact = data.assistant;

      await addContact({
        chatPath: verifiedContact.chatPath,
        name: verifiedContact.name,
        imageUrl: verifiedContact.imageUrl,
      });

      toast({
        title: "Contacto Agregado",
        description: `Has añadido a "${verifiedContact.name}". Abriendo chat...`,
      });

      // Redirect to the new chat
      router.push(`/chat/${verifiedContact.chatPath}`);

    } catch (error: any) {
      toast({
        title: 'Error al verificar contacto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
      setChatPath('');
    }
  };
  
  // Automatically try to add if dialog opens with an initial path
  React.useEffect(() => {
    if (isOpen && initialChatPath) {
      handleAddContact();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialChatPath]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Agregar Nuevo Contacto
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de chat (chat path) del contacto que quieres agregar a tu lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="chatPath">ID de Chat del Contacto</Label>
            <Input
              id="chatPath"
              placeholder="ejemplo-asistente-abc12"
              value={chatPath}
              onChange={(e) => setChatPath(e.target.value)}
              disabled={isVerifying}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isVerifying} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleAddContact} disabled={isVerifying || !chatPath.trim()} className="w-full sm:w-auto">
            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Agregar y Chatear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;