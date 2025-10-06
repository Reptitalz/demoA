// src/components/chat/DefineShowDialog.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaDollarSign, FaUniversity, FaBoxOpen, FaCheckCircle } from 'react-icons/fa';
import { Settings, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

type ShowOption = 'credit' | 'bank' | 'products' | 'none';

interface DefineShowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectShow: (option: ShowOption) => void;
}


const options: { id: ShowOption; icon: React.ElementType; title: string; description: string }[] = [
    { id: 'credit', icon: FaDollarSign, title: 'Crédito Disponible', description: 'Muestra tu línea de crédito para clientes.' },
    { id: 'bank', icon: FaUniversity, title: 'Ganancia en Banco', description: 'Muestra las ganancias totales de tus bots.' },
    { id: 'products', icon: FaBoxOpen, title: 'Productos por Recolectar', description: 'Muestra los pedidos pendientes.' },
    { id: 'none', icon: XCircle, title: 'Nada', description: 'No mostrar información rápida en la cabecera.' },
];

const DefineShowDialog = ({ isOpen, onOpenChange, onSelectShow }: DefineShowDialogProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<ShowOption>('none');
  
  const handleSave = () => {
    onSelectShow(selectedOption);
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
            <DialogTitle className="flex items-center gap-2 text-xl">
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
                          "cursor-pointer transition-all border",
                          isSelected ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/50"
                      )}
                  >
                      <CardContent className="p-3 flex items-center gap-3">
                          <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                          <div className="flex-grow">
                              <p className="font-semibold text-sm">{option.title}</p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          {isSelected && <FaCheckCircle className="h-5 w-5 text-primary"/>}
                      </CardContent>
                  </Card>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">Guardar Preferencia</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DefineShowDialog;
