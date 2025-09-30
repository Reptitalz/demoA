// src/components/chat/admin/CreateAssistantDialog.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from "@/hooks/use-toast";
import { FaArrowLeft, FaArrowRight, FaSpinner, FaImage, FaUser, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { ShoppingCart, HandCoins, Handshake, LifeBuoy, ClipboardList, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface CreateAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleOptions = [
    { id: 'vendedor', title: 'Vendedor', icon: ShoppingCart, prompt: "Como vendedor experto, tu objetivo es presentar los productos de manera atractiva, responder preguntas sobre ellos y guiar al cliente para cerrar la venta. Sé proactivo y persuasivo." },
    { id: 'cobrador', title: 'Cobrador', icon: HandCoins, prompt: "Actúas como un gestor de cobranza. Tu tono debe ser firme pero siempre respetuoso. Tu misión es recordar los pagos pendientes y ofrecer opciones para facilitar el pago." },
    { id: 'negociador', title: 'Negociador', icon: Handshake, prompt: "Tu habilidad especial es la negociación. Debes ser capaz de entender las necesidades de ambas partes para proponer acuerdos que sean beneficiosos para todos, manteniendo una relación cordial." },
    { id: 'soporte', title: 'Agente de Soporte', icon: LifeBuoy, prompt: "Proporcionas soporte y ayuda al cliente. Eres paciente, empático y tu objetivo principal es entender los problemas de los usuarios para ofrecerles soluciones claras y efectivas." },
    { id: 'tomador_pedidos', title: 'Tomador de Pedidos', icon: ClipboardList, prompt: "Tu función es tomar pedidos de manera eficiente y precisa. Debes solicitar todos los detalles necesarios, confirmar la orden con el cliente antes de finalizar y asegurarte de que no haya errores." },
];

function generateChatPath(assistantName: string): string {
  const slug = assistantName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${slug}-${randomSuffix}`;
}

const CreateAssistantDialog = ({ isOpen, onOpenChange }: CreateAssistantDialogProps) => {
    const { state, dispatch } = useApp();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [assistantName, setAssistantName] = useState('');
    const [selectedRole, setSelectedRole] = useState<typeof roleOptions[0] | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when dialog is closed
            setTimeout(() => {
                setStep(1);
                setAssistantName('');
                setSelectedRole(null);
                setImageUrl(null);
                setIsProcessing(false);
            }, 300); // Delay reset to allow for closing animation
        }
    }, [isOpen]);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                const newIndex = Math.round(scrollLeft / cardWidth);
                setActiveIndex(newIndex);
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ title: "Archivo demasiado grande", description: "Por favor, selecciona una imagen de menos de 2MB.", variant: "destructive"});
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setImageUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleFinish = () => {
        if (!assistantName) {
            toast({ title: "Nombre Requerido", description: "Por favor, asigna un nombre a tu asistente.", variant: "destructive" });
            return;
        }
        if (!selectedRole) {
            toast({ title: "Rol Requerido", description: "Por favor, selecciona un rol para tu asistente.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        const finalImageUrl = imageUrl || DEFAULT_ASSISTANT_IMAGE_URL;

        const newAssistant: AssistantConfig = {
            id: `asst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: assistantName,
            type: 'desktop', // Always create a desktop assistant from here
            prompt: selectedRole.prompt,
            purposes: [],
            isActive: true, // Should be active by default? Decided yes for now.
            numberReady: true,
            messageCount: 0,
            monthlyMessageLimit: 0,
            imageUrl: finalImageUrl,
            chatPath: generateChatPath(assistantName),
        };

        dispatch({ type: 'ADD_ASSISTANT', payload: newAssistant });

        toast({
            title: "¡Asistente Creado!",
            description: `Tu nuevo asistente "${assistantName}" está listo para usarse.`,
        });

        setIsProcessing(false);
        onOpenChange(false);
    };

    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-fadeIn w-full max-w-md mx-auto">
                        <div className="space-y-2">
                            <Label htmlFor="assistant-name" className="text-lg font-semibold">Nombre del Asistente</Label>
                            <Input id="assistant-name" value={assistantName} onChange={e => setAssistantName(e.target.value)} placeholder="Ej: Asistente de Ventas" className="text-base py-6"/>
                        </div>
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
                            className="mt-4"
                        >
                            <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <motion.div
                                        animate={{ y: [-1, 1, -1] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                                            <AvatarImage src={imageUrl || undefined} alt={assistantName} />
                                            <AvatarFallback className="text-lg bg-muted">
                                                {assistantName ? assistantName.charAt(0) : <FaUser />}
                                            </AvatarFallback>
                                        </Avatar>
                                    </motion.div>
                                    <div className="flex-grow overflow-hidden">
                                    <div className="flex items-center justify-between">
                                            <p className="font-semibold truncate text-sm">{assistantName || 'Nombre del Asistente'}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn("relative flex h-2 w-2")}>
                                                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-400 animate-ping")}></span>
                                                    <span className={cn("relative inline-flex rounded-full h-2 w-2 bg-green-500")}></span>
                                                </span>
                                                <p className="text-xs text-muted-foreground">en línea</p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">Reciente</p>
                                    </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-fadeIn w-full max-w-md mx-auto">
                        <Label className="text-lg font-semibold">Rol del Asistente</Label>
                         <div
                            ref={scrollRef}
                            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide -m-2 p-2"
                        >
                            {roleOptions.map((role, index) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole?.id === role.id;
                                return (
                                     <div key={role.id} className="w-full flex-shrink-0 snap-center p-2">
                                        <Card 
                                            onClick={() => setSelectedRole(role)}
                                            className={cn("transition-all border-2 overflow-hidden shadow-lg h-full cursor-pointer", isSelected ? "border-primary shadow-primary/20" : "hover:border-primary/50", "glow-card")}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                        <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                                                    </div>
                                                     {isSelected && <CheckCircle className="h-5 w-5 text-primary"/>}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <h5 className="font-semibold text-sm">{role.title}</h5>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-center mt-2 space-x-2">
                            {roleOptions.map((_, index) => (
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
                                        activeIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                                    )}
                                    aria-label={`Ir al rol ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                     <div className="space-y-4 animate-fadeIn w-full max-w-md mx-auto">
                        <Label className="text-lg font-semibold">Imagen de Perfil (Opcional)</Label>
                         <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square w-48 h-48 mx-auto border-2 border-dashed rounded-full flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary transition-colors bg-muted/50"
                        >
                             {imageUrl ? (
                                <Avatar className="w-full h-full">
                                    <AvatarImage src={imageUrl} alt="Vista previa" />
                                    <AvatarFallback><FaUser/></AvatarFallback>
                                </Avatar>
                            ) : (
                                <>
                                    <FaImage className="h-10 w-10 mb-2" />
                                    <p className="text-sm text-center">Subir imagen</p>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg w-screen h-screen max-w-full flex flex-col p-0" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
                 <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                       <FaRobot/> Crear Nuevo Asistente
                    </DialogTitle>
                    <DialogDescription>
                        Sigue estos sencillos pasos para configurar tu nuevo asistente.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4 flex-grow flex items-center justify-center">
                    {renderContent()}
                </div>

                <DialogFooter className="flex justify-between w-full p-4 border-t">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
                            <FaArrowLeft className="mr-2"/> Atrás
                        </Button>
                    ) : <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>}
                    
                    {step < 3 ? (
                        <Button onClick={handleNext} disabled={isProcessing || !assistantName || (step === 2 && !selectedRole)}>
                           Siguiente <FaArrowRight className="ml-2"/>
                        </Button>
                    ) : (
                         <Button onClick={handleFinish} disabled={isProcessing}>
                            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
                           Finalizar y Crear
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateAssistantDialog;
