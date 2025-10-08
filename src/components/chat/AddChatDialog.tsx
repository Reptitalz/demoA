// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, CheckCircle, XCircle, QrCode, Share2, Copy, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useContacts } from '@/hooks/useContacts';
import { useRouter } from 'next/navigation';
import { AssistantConfig } from '@/types';
import { useApp } from '@/providers/AppProvider';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string;
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { contacts, addContact } = useContacts();
  const { toast } = useToast();
  const router = useRouter();

  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedContact, setVerifiedContact] = useState<AssistantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const userShareLink = userProfile.chatPath ? `${window.location.origin}/chat/conversation/${userProfile.chatPath}` : '';
  const qrCodeUrl = userShareLink ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(userShareLink)}&size=200x200&bgcolor=f0f5ff` : '';


  useEffect(() => {
    if (isOpen) {
      setChatPath(initialChatPath);
      setVerifiedContact(null);
      setError(null);
      setIsVerifying(false);
      setActiveIndex(0);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0 });
      }
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
    }, 500);

    return () => clearTimeout(handler);
  }, [chatPath, handleVerifyChatPath]);

   useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = scrollRef.current.offsetWidth;
        if (cardWidth > 0) {
          const newIndex = Math.round(scrollLeft / cardWidth);
          setActiveIndex(newIndex);
        }
      }
    };
    const scroller = scrollRef.current;
    if (scroller) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      return () => scroller.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(userShareLink);
    toast({ title: 'Enlace Copiado', description: 'Tu enlace de chat ha sido copiado.' });
  }

  const handleShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: `Chatea conmigo en ${"Hey Manito!"}`,
                  text: `Añádeme a tus contactos en ${"Hey Manito!"}.`,
                  url: userShareLink,
              });
          } catch (error) {
              console.error('Error al compartir:', error);
          }
      } else {
          handleCopyLink();
      }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-md sm:h-auto sm:rounded-lg">
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <UserPlus /> Agregar Contacto
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
            
            {/* Slide 1: Add by ID */}
            <div className="w-full flex-shrink-0 snap-center p-4 flex flex-col items-center justify-center">
              <h3 className="font-semibold text-center mb-4">Añadir con ID de Chat</h3>
              <div className="w-full max-w-sm space-y-4">
                  <div className="relative">
                      <Input id="chatPath" placeholder="ejemplo-asistente-abc12" value={chatPath} onChange={(e) => setChatPath(e.target.value)} className="py-6 text-base text-center"/>
                      {isVerifying && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                  </div>
                  <AnimatePresence>
                    {verifiedContact && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Card className="bg-green-500/10 border-green-500/30"><CardContent className="p-3 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-600" /><Avatar className="h-10 w-10"><AvatarImage src={verifiedContact.imageUrl} alt={verifiedContact.name} /><AvatarFallback>{verifiedContact.name?.charAt(0)}</AvatarFallback></Avatar><div className="flex-grow"><p className="font-semibold text-sm">{verifiedContact.name}</p><p className="text-xs text-muted-foreground">Contacto encontrado</p></div></CardContent></Card></motion.div>}
                    {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><p className="text-sm text-destructive flex items-center justify-center gap-2"><XCircle className="h-4 w-4" /> {error}</p></motion.div>}
                  </AnimatePresence>
              </div>
              <Button onClick={handleAddAndChat} disabled={!verifiedContact} className="mt-6">Agregar y Chatear</Button>
            </div>
            
            {/* Slide 2: QR Code */}
            <div className="w-full flex-shrink-0 snap-center p-4 flex flex-col items-center justify-center">
                <h3 className="font-semibold text-center mb-4">Mi Código QR</h3>
                <Card className="p-4 bg-muted/30">
                    {qrCodeUrl ? <Image src={qrCodeUrl} alt="Tu código QR" width={200} height={200} /> : <div className="h-[200px] w-[200px] flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                </Card>
                 <p className="text-xs text-center text-muted-foreground mt-4 max-w-xs">Pide a tus contactos que escaneen este código con la cámara de su teléfono para agregarte.</p>
            </div>
            
            {/* Slide 3: Share Link */}
            <div className="w-full flex-shrink-0 snap-center p-4 flex flex-col items-center justify-center">
                 <h3 className="font-semibold text-center mb-4">Compartir mi Perfil</h3>
                 <Card className="p-4 w-full max-w-xs text-center bg-muted/30 space-y-4">
                     <LinkIcon className="h-12 w-12 text-primary mx-auto"/>
                     <p className="text-sm text-muted-foreground">Comparte tu enlace personal para que otros te agreguen fácilmente.</p>
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCopyLink} className="flex-1"><Copy className="mr-2 h-4 w-4"/> Copiar</Button>
                        <Button onClick={handleShare} className="flex-1"><Share2 className="mr-2 h-4 w-4"/> Compartir</Button>
                     </div>
                 </Card>
            </div>
            
          </div>
        </div>

        <DialogFooter className="p-4 border-t w-full">
           <div className="flex justify-center w-full space-x-2">
              {[...Array(3)].map((_, index) => (
                  <button
                      key={index}
                      onClick={() => {
                          if (scrollRef.current) {
                              const cardWidth = scrollRef.current.offsetWidth;
                              scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                          }
                      }}
                      className={cn(
                          "h-2 w-2 rounded-full transition-all",
                          activeIndex === index ? "w-6 bg-primary" : "bg-muted-foreground/50"
                      )}
                      aria-label={`Ir al panel ${index + 1}`}
                  />
              ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
