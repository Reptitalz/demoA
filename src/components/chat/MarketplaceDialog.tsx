// src/components/chat/MarketplaceDialog.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaShoppingBag, FaDollarSign, FaBoxOpen } from 'react-icons/fa';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';
import { Input } from '../ui/input';
import { Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

interface MarketplaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo data - replace with actual data from an API
const demoProducts = [
  { id: 1, name: "Asesoría de Marketing Digital", price: 1500, seller: "Juan Pérez", imageUrl: "https://i.imgur.com/8p8Yf9u.png", imageHint: 'digital marketing' },
  { id: 2, name: "Diseño de Logotipo Profesional", price: 1200, seller: "Ana Gómez", imageUrl: "https://i.imgur.com/a2gGAlJ.png", imageHint: 'logo design' },
  { id: 3, name: "Paquete de Redes Sociales", price: 2500, seller: "Carlos Ruiz", imageUrl: "https://i.imgur.com/uSfeGjW.png", imageHint: 'social media' },
  { id: 4, name: "Clases de Guitarra Acústica", price: 300, seller: "Sofía Luna", imageUrl: "https://i.imgur.com/cQ0Dvhv.png", imageHint: 'guitar lesson' },
  { id: 5, name: "Mantenimiento de PC Remoto", price: 500, seller: "Luis Mendoza", imageUrl: "https://i.imgur.com/W2yvA5L.png", imageHint: 'pc maintenance' },
  { id: 6, name: "Crédito Rápido Personal", amount: 1000, interest: "10%", seller: "Financiera Confianza", imageUrl: "https://i.imgur.com/sM7a2pM.png", imageHint: 'personal loan' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const MarketplaceDialog = ({ isOpen, onOpenChange }: MarketplaceDialogProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return demoProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col p-0 sm:max-w-4xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl">
        <DialogHeader className="p-4 sm:p-6 pb-0">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <FaShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-brand-gradient">
                Mercado
              </DialogTitle>
              <DialogDescription>
                Explora productos y servicios de la comunidad.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 mt-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                />
            </div>
        </div>
        
        <div className="px-4 sm:px-6 mt-4">
             <div className="p-3 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 flex items-center gap-3 text-sm">
                <Sparkles className="h-5 w-5 shrink-0"/>
                <p className="font-semibold">¡Nuevos productos de la comunidad cada día!</p>
            </div>
        </div>

        <ScrollArea className="flex-grow my-4">
            <div className="px-4 sm:px-6">
                {filteredProducts.length > 0 ? (
                    <motion.div 
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredProducts.map(product => (
                            <motion.div key={product.id} variants={cardVariants}>
                                <Card className="overflow-hidden cursor-pointer group glow-card transition-all duration-300 hover:scale-105 hover:shadow-primary/20">
                                    <div className="aspect-square relative w-full">
                                        <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={product.imageHint} />
                                    </div>
                                    <CardContent className="p-2 sm:p-3">
                                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">de {product.seller}</p>
                                        <p className="font-bold text-base mt-1">
                                            {'price' in product ? `$${product.price.toFixed(2)}` : `$${product.amount?.toLocaleString()}`}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        <p>No se encontraron productos para "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceDialog;
