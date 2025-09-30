// src/components/chat/ProductCatalogDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaTags, FaSpinner } from 'react-icons/fa';
import type { AssistantConfig, Product, Catalog } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';
import { useApp } from '@/providers/AppProvider';

interface ProductCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
  onProductSelect: (product: Product) => void;
}

const ProductCatalogDialog = ({ isOpen, onOpenChange, assistant, onProductSelect }: ProductCatalogDialogProps) => {
  const { state } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const catalog = useMemo(() => {
    if (!assistant.catalogId) return null;
    return userProfile.catalogs?.find(c => c.id === assistant.catalogId);
  }, [assistant.catalogId, userProfile.catalogs]);
  
  const products = catalog?.products || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-full flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaTags /> {catalog?.name || 'Catálogo de Productos'}
          </DialogTitle>
          <DialogDescription>
            Explora los productos disponibles de {assistant.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          {products.length > 0 ? (
            <div className="p-1 grid grid-cols-2 gap-3">
              {products.map(product => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:shadow-lg hover:border-primary transition-all overflow-hidden"
                  onClick={() => onProductSelect(product)}
                >
                  <div className="aspect-square relative w-full">
                     <Image src={product.imageUrl || 'https://placehold.co/300x300'} alt={product.name} layout="fill" objectFit="cover" />
                  </div>
                  <CardContent className="p-2">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-primary font-bold">${product.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-center text-muted-foreground p-8">Este asistente no tiene un catálogo de productos asignado.</p>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCatalogDialog;
