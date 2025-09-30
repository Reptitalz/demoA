// src/components/chat/admin/DatabaseLinkDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { FaGoogle, FaSpinner } from 'react-icons/fa';
import { useApp } from '@/providers/AppProvider';

interface DatabaseLinkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: string;
}

const DatabaseLinkDialog = ({ isOpen, onOpenChange, assistantId }: DatabaseLinkDialogProps) => {
  const { toast } = useToast();
  const { state, dispatch } = useApp();
  const [sheetUrl, setSheetUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLinkDatabase = async () => {
    if (!sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/')) {
      toast({
        title: "URL Inválida",
        description: "Por favor, ingresa una URL válida de Google Sheets.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);

    try {
        const response = await fetch('/api/assistants/link-database', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assistantId: assistantId,
                sheetUrl: sheetUrl,
                userId: state.userProfile._id?.toString(),
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'No se pudo vincular la base de datos.');
        }
        
        // Dispatch actions to update global state
        dispatch({ type: 'ADD_DATABASE_TO_ASSISTANT', payload: { assistantId: result.updatedAssistantId, database: result.newDatabase } });

        toast({
            title: "¡Éxito!",
            description: "La base de datos de Google Sheets ha sido vinculada correctamente."
        });

        onOpenChange(false);
        setSheetUrl('');

    } catch (error: any) {
        toast({
            title: "Error al Vincular",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaGoogle /> Vincular Base de Datos
          </DialogTitle>
          <DialogDescription>
            Pega la URL de una Hoja de Google para darle conocimiento a este asistente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="sheet-url">URL de Google Sheets</Label>
          <Input
            id="sheet-url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            disabled={isProcessing}
          />
           <p className="text-xs text-muted-foreground pt-1">
            Recuerda compartir la hoja con permisos de 'Editor' a <code className="p-1 bg-muted rounded">excel-sheets-writer@reptitalz-413408.iam.gserviceaccount.com</code>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleLinkDatabase} disabled={isProcessing || !sheetUrl}>
             {isProcessing ? <FaSpinner className="animate-spin mr-2"/> : null}
            Vincular Hoja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DatabaseLinkDialog;
