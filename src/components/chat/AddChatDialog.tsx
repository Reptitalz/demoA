// src/components/chat/AddChatDialog.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, CheckCircle, XCircle, QrCode, Share2, Copy, Link as LinkIcon, ArrowLeft, Camera, ScanLine } from 'lucide-react';
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
import Webcam from "react-webcam";
import jsQR from "jsqr";

interface AddChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialChatPath?: string;
}

const QRScanner = ({ onScanSuccess }: { onScanSuccess: (data: string) => void }) => {
    const webcamRef = useRef<Webcam>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        const checkCamera = async () => {
             try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error("Camera access error:", error);
                setCameraError("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
            }
        };
        checkCamera();
    }, []);

    const capture = useCallback(() => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    onScanSuccess(code.data);
                }
            }
        }
    }, [webcamRef, onScanSuccess]);

    useEffect(() => {
        const interval = setInterval(capture, 500); // Scan every 500ms
        return () => clearInterval(interval);
    }, [capture]);

    return (
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {cameraError ? (
                <div className="text-destructive-foreground text-center p-4">
                    <p>{cameraError}</p>
                </div>
            ) : (
                <>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "environment" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-64 h-64 border-4 border-white/50 rounded-lg animate-pulse" />
                </div>
                <ScanLine className="absolute top-0 left-0 w-full h-1 bg-red-500/70 animate-scan" style={{ animation: 'scan 2s linear infinite' }}/>
                </>
            )}
        </div>
    )
}

const AddChatDialog = ({ isOpen, onOpenChange, initialChatPath = '' }: AddChatDialogProps) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { contacts, addContact } = useContacts();
  const { toast } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<'options' | 'add' | 'share' | 'scan'>('options');
  const [chatPath, setChatPath] = useState(initialChatPath);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedContact, setVerifiedContact] = useState<AssistantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const userShareLink = userProfile.chatPath ? `${window.location.origin}/chat/conversation/${userProfile.chatPath}` : '';
  const qrCodeUrl = userShareLink ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(userShareLink)}&size=200x200&bgcolor=f0f5ff` : '';


  useEffect(() => {
    if (isOpen) {
      setChatPath(initialChatPath);
      setVerifiedContact(null);
      setError(null);
      setIsVerifying(false);
      setMode('options');
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
  
  const handleScanSuccess = (data: string) => {
    const url = new URL(data);
    const path = url.pathname.split('/').pop();
    if (path) {
        setChatPath(path);
        setMode('add');
    } else {
        toast({ title: "Código QR Inválido", description: "El código no contiene un enlace de perfil válido.", variant: "destructive" });
    }
  }

  useEffect(() => {
    if(mode === 'add'){
        const handler = setTimeout(() => {
          handleVerifyChatPath(chatPath);
        }, 500);
        return () => clearTimeout(handler);
    }
  }, [chatPath, handleVerifyChatPath, mode]);

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

  const renderContent = () => {
    switch (mode) {
      case 'scan':
        return (
          <div className="w-full flex-shrink-0 p-4 flex flex-col items-center justify-center">
             <h3 className="font-semibold text-center mb-4">Escanear Código QR</h3>
             <QRScanner onScanSuccess={handleScanSuccess} />
          </div>
        );
      case 'add':
        return (
          <div className="w-full flex-shrink-0 p-4 flex flex-col items-center justify-center">
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
        );
      case 'share':
        return (
          <div className="w-full flex-shrink-0 p-4 flex flex-col items-center justify-center">
            <h3 className="font-semibold text-center mb-4">Mi Código QR</h3>
            <Card className="p-4 bg-muted/30">
                {qrCodeUrl ? <Image src={qrCodeUrl} alt="Tu código QR" width={200} height={200} /> : <div className="h-[200px] w-[200px] flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
            </Card>
            <p className="text-xs text-center text-muted-foreground mt-4 max-w-xs">Pide a tus contactos que escaneen este código para agregarte.</p>
            <div className="flex gap-2 mt-4">
               <Button variant="outline" onClick={handleCopyLink}><Copy className="mr-2 h-4 w-4"/> Copiar Enlace</Button>
               <Button onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/> Compartir</Button>
            </div>
          </div>
        );
      case 'options':
      default:
        return (
          <div className="p-4 space-y-4">
             <Card onClick={() => setMode('add')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <UserPlus className="h-8 w-8 text-primary"/>
                    <div>
                        <h4 className="font-semibold">Agregar un Contacto</h4>
                        <p className="text-sm text-muted-foreground">Añade a alguien usando su ID de chat.</p>
                    </div>
                </CardContent>
             </Card>
             <Card onClick={() => setMode('scan')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <Camera className="h-8 w-8 text-primary"/>
                    <div>
                        <h4 className="font-semibold">Escanear Código QR</h4>
                        <p className="text-sm text-muted-foreground">Usa tu cámara para agregar un contacto rápidamente.</p>
                    </div>
                </CardContent>
             </Card>
              <Card onClick={() => setMode('share')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <QrCode className="h-8 w-8 text-primary"/>
                    <div>
                        <h4 className="font-semibold">Compartir mi Perfil</h4>
                        <p className="text-sm text-muted-foreground">Muestra tu código QR o comparte un enlace para que te agreguen.</p>
                    </div>
                </CardContent>
             </Card>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-md sm:h-auto sm:rounded-lg">
        <DialogHeader className="p-4 border-b text-left flex-row items-center gap-2">
          {mode !== 'options' && (
              <Button variant="ghost" size="icon" onClick={() => setMode('options')} className="h-8 w-8">
                  <ArrowLeft />
              </Button>
          )}
          <DialogTitle>Agregar Contacto</DialogTitle>
        </DialogHeader>

        <div className="flex-grow flex flex-col overflow-auto">
            {renderContent()}
        </div>

        <DialogFooter className="p-4 border-t w-full">
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChatDialog;
