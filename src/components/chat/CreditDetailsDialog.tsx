// src/components/chat/CreditDetailsDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FaDollarSign, FaHandshake } from 'react-icons/fa';
import { Card, CardContent } from '../ui/card';

interface CreditDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  creditAmount: number;
  creditProvider: string;
}

const CreditDetailsDialog = ({ isOpen, onOpenChange, creditAmount, creditProvider }: CreditDetailsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaDollarSign /> Detalles de Crédito
          </DialogTitle>
          <DialogDescription>
            Información sobre tu línea de crédito disponible.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Card className="text-center shadow-lg bg-gradient-to-br from-primary/10 to-transparent glow-card">
                <CardContent className="p-6">
                    <p className="text-muted-foreground font-normal text-sm">Crédito Autorizado</p>
                    <p className="text-4xl font-extrabold text-foreground mt-1">
                        ${creditAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </CardContent>
            </Card>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FaHandshake className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="text-xs text-muted-foreground">Proveedor del Crédito</p>
                    <p className="font-semibold text-sm">{creditProvider}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditDetailsDialog;
