// src/components/chat/admin/AddProductDialog.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackagePlus, Upload } from 'lucide-react';
import type { Product } from '@/types';
import { useApp } from '@/providers/AppProvider';
import Image from 'next/image';

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  catalogId: string;
  productToEdit?: Product | null;
}

const AddProductDialog = ({ isOpen, onOpenChange, catalogId, productToEdit }: AddProductDialogProps) => {
  const { dispatch } = useApp();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        if (productToEdit) {
            setName(productToEdit.name);
            setDescription(productToEdit.description || '');
            setPrice(productToEdit.price.toString());
            setImageUrl(productToEdit.imageUrl || null);
        } else {
            // Reset form for new product
            setName('');
            setDescription('');
            setPrice('');
            setImageUrl(null);
        }
    }
  }, [isOpen, productToEdit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Imagen muy grande", description: "Elige una imagen de menos de 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    if (!name || !price) {
        toast({ title: "Campos requeridos", description: "El nombre y el precio son obligatorios.", variant: "destructive" });
        return;
    }
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
        toast({ title: "Precio inválido", description: "Ingresa un número válido para el precio.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);

    const productData: Product = {
        id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
        name,
        description,
        price: priceNumber,
        imageUrl: imageUrl || undefined,
    };
    
    dispatch({
        type: productToEdit ? 'UPDATE_PRODUCT_IN_CATALOG' : 'ADD_PRODUCT_TO_CATALOG',
        payload: { catalogId, product: productData }
    });
    
    toast({
        title: productToEdit ? "Producto Actualizado" : "Producto Añadido",
        description: `"${name}" ha sido guardado en el catálogo.`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus /> {productToEdit ? 'Editar Producto' : 'Añadir Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Actualiza los detalles de este producto.' : 'Completa la información del nuevo producto para tu catálogo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
                <Label>Imagen del Producto (Opcional)</Label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full border-2 border-dashed rounded-md flex items-center justify-center relative cursor-pointer bg-muted/50 hover:bg-muted"
                >
                    {imageUrl ? (
                        <Image src={imageUrl} alt="Vista previa del producto" layout="fill" objectFit="contain" className="p-1 rounded-md" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <Upload className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-xs">Subir imagen</p>
                        </div>
                    )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input id="product-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Pizza de Peperoni" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="product-price">Precio</Label>
                <Input id="product-price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ej: 150.00" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="product-description">Descripción (Opcional)</Label>
                <Textarea id="product-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Pizza clásica con salsa de tomate, queso mozzarella y peperoni." />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            {productToEdit ? 'Guardar Cambios' : 'Añadir Producto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
