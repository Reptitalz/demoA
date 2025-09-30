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
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShoppingCart, HandCoins, Handshake, LifeBuoy, ClipboardList, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


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
  const scrollAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (isOpen && assistant) {
      setPrompt(assistant.prompt || '');
      setSelectedRoles(new Set()); // Reset roles on open
    }
  }, [isOpen, assistant]);

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
                <ScrollArea ref={scrollAreaRef} className="w-full">
                  <div className="flex space-x-3 pb-4">
                      {roleOptions.map(role => {
                          const Icon = role.icon;
                          const isSelected = selectedRoles.has(role.id);
                          return (
                              <Card 
                                key={role.id} 
                                onClick={() => handleRoleToggle(role.id)}
                                className={cn(
                                    "w-36 h-36 flex-shrink-0 cursor-pointer transition-all border-2 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden",
                                    isSelected ? "border-primary bg-primary/10" : "hover:border-primary/50"
                                )}
                              >
                                  {isSelected && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary"/>}
                                  <Icon className={cn("h-7 w-7 mb-2", isSelected ? "text-primary" : "text-muted-foreground")}/>
                                  <p className="text-xs font-semibold">{role.title}</p>
                              </Card>
                          )
                      })}
                  </div>
                </ScrollArea>
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
