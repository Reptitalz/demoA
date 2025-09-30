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
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUser } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
                        <div className="flex items-center justify-between">
                            <p className="font-semibold truncate text-sm">{chatPath || 'Nombre del Contacto'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-muted-foreground">en línea</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">Ahora</p>
                        </div>
                        </div>
                    </CardContent>
                </Card>
              </div>
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
