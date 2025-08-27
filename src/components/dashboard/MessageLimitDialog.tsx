
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { MessagesSquare, Coins } from 'lucide-react';
import type { AssistantConfig } from '@/types';
import { MESSAGES_PER_CREDIT } from '@/config/appConfig';
import { cn } from '@/lib/utils';

interface MessageLimitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const MessageLimitDialog = ({ isOpen, onOpenChange, assistant }: MessageLimitDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  
  const [limit, setLimit] = useState(assistant.monthlyMessageLimit || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalUserMessages = state.userProfile.credits * MESSAGES_PER_CREDIT;
  
  const otherAssistantsAssignedMessages = useMemo(() => {
    return state.userProfile.assistants
      .filter(a => a.id !== assistant.id)
      .reduce((total, a) => total + (a.monthlyMessageLimit || 0), 0);
  }, [state.userProfile.assistants, assistant.id]);

  const maxAvailableForThisAssistant = totalUserMessages - otherAssistantsAssignedMessages;
  
  useEffect(() => {
    if (isOpen) {
      // Ensure the initial limit is not more than what's available
      const initialLimit = Math.min(assistant.monthlyMessageLimit || 0, maxAvailableForThisAssistant);
      setLimit(initialLimit);
    }
  }, [isOpen, assistant.monthlyMessageLimit, maxAvailableForThisAssistant]);
  
  const creditsCost = limit / MESSAGES_PER_CREDIT;

  const handleSave = () => {
    if (limit > maxAvailableForThisAssistant) {
      toast({
        title: "Límite Excedido",
        description: `No tienes suficientes créditos para asignar ${limit.toLocaleString()} mensajes.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    const updatedAssistant: AssistantConfig = {
      ...assistant,
      monthlyMessageLimit: limit,
      isActive: limit > 0 // Activate assistant if a limit is set
    };
    
    dispatch({ type: 'UPDATE_ASSISTANT', payload: updatedAssistant });
    
    toast({
      title: "Límite Guardado",
      description: `Se asignó un límite de ${limit.toLocaleString()} mensajes mensuales para "${assistant.name}".`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessagesSquare /> Asignar Límite de Mensajes
          </DialogTitle>
          <DialogDescription>
            Define cuántos mensajes podrá enviar "{assistant.name}" al mes. Los mensajes se descuentan de tu saldo de créditos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo total de mensajes:</span>
              <span className="font-semibold">{totalUserMessages.toLocaleString()}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Asignados a otros asistentes:</span>
              <span className="font-semibold">{otherAssistantsAssignedMessages.toLocaleString()}</span>
            </div>
             <div className="flex justify-between text-primary font-bold">
              <span >Disponibles para asignar:</span>
              <span >{maxAvailableForThisAssistant.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="message-limit-slider" className="text-base font-medium">Límite Mensual para este Asistente</Label>
             <div className="text-center text-3xl font-bold text-primary">
                {limit.toLocaleString()}
            </div>
            <Slider
              id="message-limit-slider"
              min={0}
              max={maxAvailableForThisAssistant > 0 ? maxAvailableForThisAssistant : 1000} // provide a sensible max if 0
              step={MESSAGES_PER_CREDIT / 10} // Step in increments of 100 messages
              value={[limit]}
              onValueChange={(value) => setLimit(value[0])}
              disabled={isProcessing || maxAvailableForThisAssistant <= 0}
            />
             <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxAvailableForThisAssistant > 0 ? maxAvailableForThisAssistant.toLocaleString() : 'Sin saldo'}</span>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Costo de esta asignación</p>
              <div className="flex items-center justify-center gap-2 text-xl font-bold">
                  <Coins className="h-5 w-5 text-accent" />
                  <p>{creditsCost.toFixed(2)} créditos</p>
              </div>
          </div>

           <div className={cn("text-xs p-2 rounded-md flex items-start gap-2", limit > maxAvailableForThisAssistant ? 'bg-destructive/10 text-destructive' : 'bg-blue-500/10 text-blue-700 dark:text-blue-300')}>
            <FaInfoCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              {limit > maxAvailableForThisAssistant 
                ? "No tienes suficientes créditos. Reduce el límite o recarga tu saldo."
                : "Este límite se reiniciará cada mes. Puedes ajustarlo en cualquier momento."
              }
            </p>
           </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isProcessing || limit > maxAvailableForThisAssistant}>
            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
            Guardar Límite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageLimitDialog;
