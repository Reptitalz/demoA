
// src/components/dashboard/PrivacyDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaKey } from 'react-icons/fa';
import Link from 'next/link';

interface PrivacyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyDialog = ({ isOpen, onOpenChange }: PrivacyDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaKey /> Política de Privacidad
          </DialogTitle>
          <DialogDescription>
            Resumen de cómo manejamos tu información.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-muted-foreground">
            <p>Tu privacidad es importante. No almacenamos el contenido de las conversaciones de tus asistentes de IA. La configuración de tus asistentes y los datos de tu perfil se guardan de forma segura.</p>
            <p>Los archivos multimedia que tus clientes envían se procesan y se te presentan para tu autorización sin ser almacenados permanentemente en nuestros servidores.</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild>
                <Link href="/privacy" target="_blank">Ver Política Completa</Link>
            </Button>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyDialog;
