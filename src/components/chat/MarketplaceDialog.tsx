// src/components/chat/MarketplaceDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaShoppingBag, FaDollarSign, FaBoxOpen } from 'react-icons/fa';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';

interface MarketplaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo data - replace with actual data from an API
const demoProducts = [
  { id: 1, name: "Asesoría de Marketing", price: 1500, seller: "Juan Pérez", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
  { id: 2, name: "Diseño de Logotipo", price: 1200, seller: "Ana Gómez", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
  { id: 3, name: "Paquete de Redes Sociales", price: 2500, seller: "Carlos Ruiz", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
];
const demoServices = [
  { id: 1, name: "Clases de Guitarra", price: 300, seller: "Sofía Luna", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
  { id: 2, name: "Mantenimiento de PC", price: 500, seller: "Luis Mendoza", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
];
const demoCredits = [
  { id: 1, name: "Crédito Rápido", amount: 1000, interest: "10%", seller: "Financiera Confianza", imageUrl: "https://i.imgur.com/8p8Yf9u.png" },
];


const MarketplaceDialog = ({ isOpen, onOpenChange }: MarketplaceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col sm:max-w-3xl sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FaShoppingBag /> Mercado
          </DialogTitle>
          <DialogDescription>
            Explora productos, servicios y créditos ofrecidos por la comunidad.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="products" className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products"><FaBoxOpen className="mr-2 h-4 w-4" />Productos</TabsTrigger>
            <TabsTrigger value="services" disabled><FaDollarSign className="mr-2 h-4 w-4" />Servicios</TabsTrigger>
            <TabsTrigger value="credits" disabled><FaDollarSign className="mr-2 h-4 w-4" />Créditos</TabsTrigger>
          </TabsList>

          <div className="flex-grow mt-4 overflow-hidden">
            <ScrollArea className="h-full">
              <TabsContent value="products">
                 <div className="p-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {demoProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="aspect-square relative w-full">
                                <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" />
                            </div>
                            <CardContent className="p-2">
                                <p className="font-semibold text-sm truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">de {product.seller}</p>
                                <p className="font-bold text-primary text-sm mt-1">${product.price.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
              </TabsContent>
              <TabsContent value="services">
                <p className="text-center text-muted-foreground p-8">Los servicios estarán disponibles próximamente.</p>
              </TabsContent>
               <TabsContent value="credits">
                <p className="text-center text-muted-foreground p-8">Los créditos estarán disponibles próximamente.</p>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceDialog;