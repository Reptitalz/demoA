// src/components/chat/ProductCatalogDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaTags, FaSpinner } from 'react-icons/fa';
import type { AssistantConfig, Product } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import Image from 'next/image';
import { Card, CardContent } from '../ui/card';

interface ProductCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
  onProductSelect: (product: Product) => void;
}

const ProductCatalogDialog = ({ isOpen, onOpenChange, assistant, onProductSelect }: ProductCatalogDialogProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch(`/api/products?assistantId=${assistant.id}`)
        .then(res => {
          if (!res.ok) throw new Error('No se pudo cargar el catálogo de productos.');
          return res.json();
        })
        .then(data => setProducts(data.products))
        .catch(err => toast({ title: "Error", description: err.message, variant: 'destructive' }))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, assistant.id, toast]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaTags /> Catálogo de Productos
          </DialogTitle>
          <DialogDescription>
            Explora los productos disponibles de {assistant.name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : products.length > 0 ? (
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
            <p className="text-center text-muted-foreground p-8">No hay productos en el catálogo.</p>
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
