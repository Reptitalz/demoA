
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

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string; // Optional prop to pre-fill the input
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
  const { addContact } = useContacts();
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (isOpen) {
      setChatPath(initialChatPath);
    }
  }, [isOpen, initialChatPath]);

  const handleAddContact = async () => {
    if (!chatPath.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingresa el ID del chat del contacto.",
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/assistants/public?chatPath=${encodeURIComponent(chatPath.trim())}`);
      if (!res.ok) {
        throw new Error('No se encontró ningún asistente o usuario con ese ID.');
      }
      const data = await res.json();
      const userAsContact = data.assistant; // Endpoint returns a user/assistant profile

      await addContact({
        chatPath: userAsContact.chatPath,
        name: userAsContact.name,
        imageUrl: userAsContact.imageUrl,
      });

      toast({
        title: "Contacto Agregado",
        description: `Has añadido a "${userAsContact.name}" a tus contactos.`,
      });
      onOpenChange(false);
      setChatPath('');
      router.replace('/chat/dashboard'); // Clean URL just in case
    } catch (error: any) {
      toast({
        title: 'Error al agregar contacto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
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
      <DialogContent className="w-screen h-screen max-w-full flex flex-col sm:w-full sm:max-w-md sm:h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Agregar Nuevo Contacto
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de chat (chat path) del contacto que quieres agregar a tu lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow flex flex-col items-center justify-center">
            <div className='w-full max-w-sm space-y-6'>
              <div>
                <Label htmlFor="chatPath">ID de Chat del Contacto</Label>
                <Input
                  id="chatPath"
                  placeholder="ejemplo-asistente-abc12"
                  value={chatPath}
                  onChange={(e) => setChatPath(e.target.value)}
                  className="text-lg py-6"
                  disabled={isVerifying}
                />
              </div>

              {/* Chat Preview */}
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <Card className="glow-card">
                    <CardContent className="p-3 flex items-center gap-3">
                        <motion.div
                            animate={{ y: [-1, 1, -1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                                <AvatarFallback className="text-lg bg-muted">
                                    {chatPath ? chatPath.charAt(0).toUpperCase() : <FaUser />}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                        <div className="flex-grow overflow-hidden">
                          <p className="font-semibold truncate text-sm">{chatPath || 'Nombre del Contacto'}</p>
                          <p className="text-xs text-muted-foreground">Buscando...</p>
                        </div>
                    </CardContent>
                </Card>
              </div>
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
