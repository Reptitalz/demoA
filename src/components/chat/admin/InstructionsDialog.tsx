// src/components/chat/admin/InstructionsDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { FaBookReader, FaSpinner } from 'react-icons/fa';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig } from '@/types';

interface InstructionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const InstructionsDialog = ({ isOpen, onOpenChange, assistant }: InstructionsDialogProps) => {
  const { toast } = useToast();
  const { state, dispatch } = useApp();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && assistant) {
      setPrompt(assistant.prompt || '');
    }
  }, [isOpen, assistant]);

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
        
        // Dispatch action to update global state
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
      <DialogContent className="sm:max-w-xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaBookReader /> Instrucciones para "{assistant.name}"
          </DialogTitle>
          <DialogDescription>
            Aquí puedes editar el prompt del sistema que define el comportamiento del asistente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Textarea
            id="assistant-prompt"
            placeholder="Escribe aquí las instrucciones de tu asistente..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            rows={15}
            className="text-sm"
          />
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
