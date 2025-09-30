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

type ShowOption = 'credit' | 'bank' | 'products';

interface DefineShowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectShow: (option: ShowOption) => void;
}


const options: { id: ShowOption; icon: React.ElementType; title: string; description: string }[] = [
    { id: 'credit', icon: FaDollarSign, title: 'Crédito Disponible', description: 'Muestra tu línea de crédito para clientes.' },
    { id: 'bank', icon: FaUniversity, title: 'Ganancia en Banco', description: 'Muestra las ganancias totales de tus bots.' },
    { id: 'products', icon: FaBoxOpen, title: 'Productos por Recolectar', description: 'Muestra los pedidos pendientes.' },
];

const DefineShowDialog = ({ isOpen, onOpenChange, onSelectShow }: DefineShowDialogProps) => {
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<ShowOption>('credit');
  
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
      <DialogContent className="w-screen h-screen max-w-full flex flex-col items-center justify-center p-4">
        <div className='w-full max-w-md'>
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
              <Settings /> Definir Muestra Rápida
            </DialogTitle>
            <DialogDescription>
              Elige qué información quieres ver en la cabecera de tu lista de chats.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
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
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">Cancelar</Button>
            <Button onClick={handleSave} className="w-full">Guardar Preferencia</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DefineShowDialog;
