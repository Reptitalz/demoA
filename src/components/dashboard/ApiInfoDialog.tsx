
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FaCopy, FaInfoCircle, FaCode } from 'react-icons/fa';
import { AssistantConfig } from '@/types';

interface ApiInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const ApiInfoDialog = ({ isOpen, onOpenChange, assistant }: ApiInfoDialogProps) => {
  const { toast } = useToast();

  const endpoint = "https://control.reptitalz.cloud/api/v1/chat";
  
  const payload = {
    "assistantId": assistant.id,
    "chatPath": assistant.chatPath || `/chat/${assistant.name.toLowerCase().replace(/\s+/g, '-')}`,
    "executionId": "<execution_id_único_por_conversación>",
    "message": "<mensaje_del_usuario>",
    "destination": "<id_sesion_del_usuario>"
  };
  
  const formattedPayload = JSON.stringify(payload, null, 2);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado al Portapapeles",
        description: `El ${type} ha sido copiado.`,
      });
    }, () => {
      toast({
        title: "Error al Copiar",
        description: `No se pudo copiar el ${type}.`,
        variant: "destructive",
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaCode /> Información de la API para "{assistant.name}"
          </DialogTitle>
          <DialogDescription>
            Usa esta información para integrar tu asistente de escritorio en una aplicación web o de escritorio.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Endpoint (POST)</label>
            <div className="flex items-center gap-2">
              <input 
                readOnly 
                value={endpoint} 
                className="flex-grow bg-muted/50 border-border/50 rounded-md px-3 py-2 text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => handleCopy(endpoint, 'endpoint')}>
                <FaCopy />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium">Ejemplo de Payload (JSON)</label>
            <div className="relative">
              <pre className="bg-muted/50 border-border/50 rounded-md p-3 text-xs whitespace-pre-wrap overflow-x-auto font-mono">
                {formattedPayload}
              </pre>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleCopy(formattedPayload, 'payload')}
              >
                <FaCopy />
              </Button>
            </div>
          </div>
          
          <div className="p-3 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-start gap-3">
            <FaInfoCircle className="h-5 w-5 mt-0.5 shrink-0"/>
            <div>
              <h4 className="font-semibold">Funcionamiento</h4>
              <p>Este endpoint no responde directamente con el mensaje del agente. En su lugar, registra la respuesta en la base de datos de eventos. Tu aplicación cliente deberá consultar los eventos (/api/events) usando el <code className="bg-blue-200/50 dark:bg-blue-900/50 px-1 rounded">executionId</code> para recibir las respuestas en tiempo real.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiInfoDialog;
