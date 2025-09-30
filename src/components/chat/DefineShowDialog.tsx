// src/components/chat/DefineShowDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaDollarSign, FaUniversity, FaBoxOpen, FaCheckCircle } from 'react-icons/fa';
import { Settings } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface DefineShowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type ShowOption = 'credit' | 'bank' | 'products';

const options: { id: ShowOption; icon: React.ElementType; title: string; description: string }[] = [
    { id: 'credit', icon: FaDollarSign, title: 'Crédito Disponible', description: 'Muestra tu línea de crédito para clientes.' },
    { id: 'bank', icon: FaUniversity, title: 'Ganancia en Banco', description: 'Muestra las ganancias totales de tus bots.' },
    { id: 'products', icon: FaBoxOpen, title: 'Productos por Recolectar', description: 'Muestra los pedidos pendientes.' },
];

const DefineShowDialog = ({ isOpen, onOpenChange }: DefineShowDialogProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<ShowOption>('credit');
  
  const handleSave = () => {
    // Here you would save the user's preference to the global state or backend.
    toast({
        title: "Preferencia Guardada",
        description: `Se mostrará "${options.find(o => o.id === selectedOption)?.title}" en la cabecera.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings /> Definir Muestra Rápida
          </DialogTitle>
          <DialogDescription>
            Elige qué información quieres ver en la cabecera de tu lista de chats.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;
            return (
                <Card 
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={cn(
                        "cursor-pointer transition-all border-2",
                        isSelected ? "border-primary shadow-lg ring-2 ring-primary/50" : "hover:border-primary/50 hover:bg-muted/50"
                    )}
                >
                    <CardContent className="p-4 flex items-center gap-4">
                        <Icon className={cn("h-6 w-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <div className="flex-grow">
                            <p className="font-semibold">{option.title}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        {isSelected && <FaCheckCircle className="h-5 w-5 text-primary"/>}
                    </CardContent>
                </Card>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Preferencia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefineShowDialog;
