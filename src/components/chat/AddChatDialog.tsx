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

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string; // Optional prop to pre-fill the input
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
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
    
    setIsVerifying(true);
    onOpenChange(false); // Close dialog immediately

    // 1. Optimistically add the contact with placeholder data
    const tempContact = {
        chatPath: trimmedChatPath,
        name: trimmedChatPath, // Use chatPath as temporary name
        imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
    };
    addContact(tempContact);
    toast({
        title: "Agregando Contacto...",
        description: `Buscando a "${trimmedChatPath}".`,
    });

    try {
      // 2. Verify the contact in the background
      const res = await fetch(`/api/assistants/public?chatPath=${encodeURIComponent(trimmedChatPath)}`);
      
      if (!res.ok) {
        throw new Error('No se encontró ningún usuario con ese ID.');
      }
      
      const data = await res.json();
      const verifiedContact = data.assistant;

      // 3. Update the contact with real data
      await addContact({
        chatPath: verifiedContact.chatPath,
        name: verifiedContact.name,
        imageUrl: verifiedContact.imageUrl,
      });

      toast({
        title: "Contacto Verificado",
        description: `Has añadido a "${verifiedContact.name}".`,
      });

    } catch (error: any) {
      // 4. If verification fails, remove the optimistic contact
      toast({
        title: 'Error al verificar contacto',
        description: error.message,
        variant: 'destructive',
      });
      await removeContact(trimmedChatPath); // Remove by chatPath
    } finally {
      // 5. Reset state
      setIsVerifying(false);
      setChatPath('');
      router.replace('/chat/dashboard'); // Clean URL just in case
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
            Agregar Contacto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
