
"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FaImage, FaDownload } from 'react-icons/fa';
import type { Contact, ContactImage } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Placeholder data for received images
const DEMO_IMAGES: ContactImage[] = [
    { _id: 'img1', url: 'https://picsum.photos/seed/cake1/400/300', receivedAt: new Date('2024-07-28T10:30:00Z') },
    { _id: 'img2', url: 'https://picsum.photos/seed/design2/400/300', receivedAt: new Date('2024-07-27T15:00:00Z') },
    { _id: 'img3', url: 'https://picsum.photos/seed/idea3/400/300', receivedAt: new Date('2024-07-25T09:15:00Z') },
];

interface ContactImagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

const ContactImagesDialog = ({ isOpen, onOpenChange, contact }: ContactImagesDialogProps) => {
  const { toast } = useToast();
  
  const [images, setImages] = useState<ContactImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate fetching images for the contact. Replace with actual API call.
      setTimeout(() => {
        // In a real app, you'd fetch images for contact.id
        setImages(DEMO_IMAGES);
        setIsLoading(false);
      }, 500);
    }
  }, [isOpen, contact.id]);

  const handleDownload = (imageUrl: string, imageName: string) => {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = imageName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'Descarga Iniciada', description: `Se está descargando la imagen ${imageName}.` });
      })
      .catch(() => {
        toast({ title: 'Error de Descarga', description: 'No se pudo descargar la imagen.', variant: 'destructive' });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaImage /> Imágenes de {contact.name}
          </DialogTitle>
          <DialogDescription>
            Visualiza y descarga las imágenes recibidas de este contacto.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow border rounded-md -mx-2">
            <div className="p-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : images.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">
                        Este contacto no ha enviado ninguna imagen.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map(image => (
                        <div key={image._id} className="group relative overflow-hidden rounded-lg border shadow-sm">
                           <Image
                                src={image.url}
                                alt={`Imagen recibida el ${format(image.receivedAt, "PPPp", { locale: es })}`}
                                width={400}
                                height={300}
                                className="w-full h-auto object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint="contact image"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
                           <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                <p className="text-xs font-semibold">{format(image.receivedAt, "PPPp", { locale: es })}</p>
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDownload(image.url, `imagen_${contact.name.replace(/\s+/g, '_')}_${image._id}.jpg`)}
                                >
                                    <FaDownload/>
                                </Button>
                           </div>
                        </div>
                    ))}
                    </div>
                )}
            </div>
        </ScrollArea>
        
        <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactImagesDialog;
