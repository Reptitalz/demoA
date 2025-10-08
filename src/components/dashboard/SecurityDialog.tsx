
// src/components/dashboard/SecurityDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaShieldAlt } from 'react-icons/fa';

interface SecurityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SecurityDialog = ({ isOpen, onOpenChange }: SecurityDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaShieldAlt /> Seguridad de la Cuenta
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-muted-foreground">
            <p>Tu cuenta está protegida mediante la autenticación segura de tu proveedor de inicio de sesión (por ejemplo, Google). No almacenamos tu contraseña directamente.</p>
            <p>Utilizamos protocolos estándar de la industria para proteger tus datos de configuración y la información de tu cuenta.</p>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SecurityDialog;
