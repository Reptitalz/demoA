// src/components/chat/admin/InstructionsDialog.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { FaBookReader, FaSpinner } from 'react-icons/fa';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShoppingCart, HandCoins, Handshake, LifeBuoy, ClipboardList, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';


interface InstructionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const roleOptions = [
    { id: 'vendedor', title: 'Vendedor', icon: ShoppingCart, prompt: "Como vendedor experto, tu objetivo es presentar los productos de manera atractiva, responder preguntas sobre ellos y guiar al cliente para cerrar la venta. Sé proactivo y persuasivo." },
    { id: 'cobrador', title: 'Cobrador', icon: HandCoins, prompt: "Actúas como un gestor de cobranza. Tu tono debe ser firme pero siempre respetuoso. Tu misión es recordar los pagos pendientes y ofrecer opciones para facilitar el pago." },
    { id: 'negociador', title: 'Negociador', icon: Handshake, prompt: "Tu habilidad especial es la negociación. Debes ser capaz de entender las necesidades de ambas partes para proponer acuerdos que sean beneficiosos para todos, manteniendo una relación cordial." },
    { id: 'soporte', title: 'Agente de Soporte', icon: LifeBuoy, prompt: "Proporcionas soporte y ayuda al cliente. Eres paciente, empático y tu objetivo principal es entender los problemas de los usuarios para ofrecerles soluciones claras y efectivas." },
    { id: 'tomador_pedidos', title: 'Tomador de Pedidos', icon: ClipboardList, prompt: "Tu función es tomar pedidos de manera eficiente y precisa. Debes solicitar todos los detalles necesarios, confirmar la orden con el cliente antes de finalizar y asegurarte de que no haya errores." },
];

const InstructionsDialog = ({ isOpen, onOpenChange, assistant }: InstructionsDialogProps) => {
  const { toast } = useToast();
  const { state, dispatch } = useApp();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen && assistant) {
      setPrompt(assistant.prompt || '');
      setSelectedRoles(new Set()); // Reset roles on open
    }
  }, [isOpen, assistant]);
  
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
        scroller.addEventListener('scroll', handleScroll);
        return () => scroller.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleRoleToggle = (roleId: string) => {
    const newSelectedRoles = new Set(selectedRoles);
    const role = roleOptions.find(r => r.id === roleId);
    if (!role) return;

    if (newSelectedRoles.has(roleId)) {
        newSelectedRoles.delete(roleId);
        // This is complex, for now we just remove. A better implementation might remove only the specific text.
    } else {
        newSelectedRoles.add(roleId);
        setPrompt(prev => `${role.prompt}\n\n${prev}`.trim());
    }
    setSelectedRoles(newSelectedRoles);
  };

  const handleSaveChanges = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Campo Requerido",
        description: "El prompt no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);

    try {
        const response = await fetch('/api/assistants/update-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assistantId: assistant.id,
                prompt: prompt,
                userId: state.userProfile._id?.toString(),
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'No se pudo guardar el prompt.');
        }
        
        dispatch({ type: 'UPDATE_ASSISTANT', payload: result.updatedAssistant });

        toast({
            title: "¡Éxito!",
            description: "Las instrucciones del asistente han sido actualizadas."
        });

        onOpenChange(false);

    } catch (error: any) {
        toast({
            title: "Error al Guardar",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaBookReader /> Instrucciones para "{assistant.name}"
          </DialogTitle>
          <DialogDescription>
            Selecciona roles para construir una base y luego personaliza las instrucciones de tu asistente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-grow flex flex-col min-h-0">
             <div>
                <h4 className="text-sm font-semibold mb-2">1. Elige un rol (opcional)</h4>
                <div ref={scrollRef} className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
                    {roleOptions.map((role, index) => {
                        const Icon = role.icon;
                        const isSelected = selectedRoles.has(role.id);
                        return (
                            <div key={index} className="w-full flex-shrink-0 snap-center p-2" onClick={() => handleRoleToggle(role.id)}>
                                <Card className={cn("transition-all border-2 overflow-hidden shadow-lg h-full cursor-pointer", isSelected ? "border-primary shadow-primary/20" : "hover:border-primary/50", "glow-card")}>
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

             <div className="flex-grow flex flex-col min-h-0">
                <Label htmlFor="assistant-prompt" className="text-sm font-semibold mb-2">2. Personaliza las instrucciones</Label>
                <Textarea
                    id="assistant-prompt"
                    placeholder="Escribe aquí las instrucciones de tu asistente..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isProcessing}
                    className="text-sm flex-grow w-full h-full"
                />
             </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={isProcessing || !prompt}>
             {isProcessing ? <FaSpinner className="animate-spin mr-2"/> : null}
            Guardar Instrucciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstructionsDialog;
