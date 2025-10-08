// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useContacts } from '@/hooks/useContacts';
import { useRouter } from 'next/navigation';
import { AssistantConfig } from '@/types';
import { useApp } from '@/providers/AppProvider';

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string;
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedContact, setVerifiedContact] = useState<AssistantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { state } = useApp();
  const { contacts, addContact } = useContacts();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setChatPath(initialChatPath);
      setVerifiedContact(null);
      setError(null);
      setIsVerifying(false);
    }
  }, [isOpen, initialChatPath]);

  const handleAddAndChat = async () => {
    if (!verifiedContact) {
      toast({ title: "Sin contacto", description: "Verifica un ID de chat válido primero.", variant: "destructive" });
      return;
    }
    
    await addContact({
      chatPath: verifiedContact.chatPath!,
      name: verifiedContact.name,
      imageUrl: verifiedContact.imageUrl,
    });

    toast({
      title: "Contacto Agregado",
      description: `Has añadido a "${verifiedContact.name}". Abriendo chat...`,
    });
    
    onOpenChange(false);
    router.push(`/chat/conversation/${verifiedContact.chatPath}`);
  };

  const handleVerifyChatPath = useCallback(async (path: string) => {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      setError(null);
      setVerifiedContact(null);
      return;
    }
    
    if (state.userProfile.chatPath === trimmedPath) {
      setError("No puedes agregarte a ti mismo.");
      setVerifiedContact(null);
      return;
    }
    
    if (contacts.some(c => c.chatPath === trimmedPath)) {
      setError("Este contacto ya está en tu lista.");
      setVerifiedContact(null);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerifiedContact(null);

    try {
      const res = await fetch(`/api/assistants/public?chatPath=${encodeURIComponent(trimmedPath)}`);
      if (!res.ok) {
        throw new Error('ID de chat no encontrado.');
      }
      const data = await res.json();
      setVerifiedContact(data.assistant);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }, [state.userProfile.chatPath, contacts]);

  useEffect(() => {
    const handler = setTimeout(() => {
      handleVerifyChatPath(chatPath);
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [chatPath, handleVerifyChatPath]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-md sm:h-auto sm:rounded-lg">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Agregar Nuevo Contacto
          </DialogTitle>
          <DialogDescription>
            Ingresa el ID de chat del contacto para agregarlo a tu lista.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 flex-grow flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-4">
            <div>
                <Label htmlFor="chatPath">ID de Chat del Contacto</Label>
                <div className="relative">
                    <Input
                        id="chatPath"
                        placeholder="ejemplo-asistente-abc12"
                        value={chatPath}
                        onChange={(e) => setChatPath(e.target.value)}
                        className="py-6 text-base text-center"
                    />
                    {isVerifying && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                    )}
                </div>
            </div>

            <AnimatePresence>
            {verifiedContact && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-3 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={verifiedContact.imageUrl} alt={verifiedContact.name} />
                        <AvatarFallback>{verifiedContact.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <p className="font-semibold text-sm">{verifiedContact.name}</p>
                        <p className="text-xs text-muted-foreground">Contacto encontrado</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {error && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <p className="text-sm text-destructive flex items-center justify-center gap-2">
                        <XCircle className="h-4 w-4" /> {error}
                    </p>
                </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
        <DialogFooter className="p-4 border-t flex-col sm:flex-row gap-2 sm:justify-end w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAddAndChat} disabled={!verifiedContact}>
            Agregar y Chatear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
