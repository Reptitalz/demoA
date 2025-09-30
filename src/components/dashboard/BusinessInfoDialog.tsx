
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaBuilding, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe, FaImage, FaBriefcase, FaSave } from 'react-icons/fa';
import type { AssistantConfig, AssistantBusinessInfo } from '@/types';
import Image from 'next/image';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface BusinessInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assistant: AssistantConfig;
}

const BusinessInfoDialog = ({ isOpen, onOpenChange, assistant }: BusinessInfoDialogProps) => {
  const { dispatch } = useApp();
  const { toast } = useToast();
  
  const [businessInfo, setBusinessInfo] = useState<AssistantBusinessInfo>(assistant.businessInfo || {});
  const [assistantImageUrl, setAssistantImageUrl] = useState(assistant.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL);
  const [assistantName, setAssistantName] = useState(assistant.name || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && assistant) {
      setBusinessInfo(assistant.businessInfo || {});
      setAssistantImageUrl(assistant.imageUrl || DEFAULT_ASSISTANT_IMAGE_URL);
      setAssistantName(assistant.name || '');
    }
  }, [isOpen, assistant]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Archivo demasiado grande",
          description: "Por favor, selecciona una imagen de menos de 2MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssistantImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!assistantName) {
      toast({
        title: "Campo Requerido",
        description: "Por favor, especifica el nombre del asistente.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    const updatedAssistant: AssistantConfig = {
      ...assistant,
      name: assistantName,
      imageUrl: assistantImageUrl,
      businessInfo: businessInfo,
    };
    
    dispatch({ type: 'UPDATE_ASSISTANT', payload: updatedAssistant });
    
    toast({
      title: "Información Guardada",
      description: `La información para "${assistant.name}" ha sido actualizada.`,
    });
    
    setIsProcessing(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none sm:max-w-lg sm:h-auto sm:max-h-[90vh] flex flex-col p-0" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FaBuilding /> Editar Información de "{assistant.name}"
          </DialogTitle>
          <DialogDescription>
            Actualiza los detalles que tu asistente usará y que se mostrarán en su perfil.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
        <div className="p-6 grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4">
              <Image 
                src={assistantImageUrl}
                alt="Avatar del Asistente"
                width={80}
                height={80}
                className="rounded-full border object-cover h-20 w-20"
                unoptimized
              />
               <div className='space-y-2'>
                  <Label htmlFor="assistant-image">Imagen de Perfil</Label>
                   <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <FaImage className="mr-2" />
                      Cambiar Imagen
                    </Button>
               </div>
              <Input 
                id="assistant-image"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assistantName">Nombre del Asistente/Negocio</Label>
              <Input 
                id="assistantName" 
                name="assistantName" 
                type="text"
                placeholder="Ej: Pastelería Dulces Momentos"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="vertical">Categoría del Negocio (Vertical)</Label>
              <Input 
                id="vertical" 
                name="vertical" 
                type="text"
                placeholder="Ej: Ropa, Restaurante, Educación, etc."
                value={businessInfo.vertical || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyEmail">Correo de la Empresa</Label>
              <Input 
                id="companyEmail" 
                name="companyEmail" 
                type="email"
                placeholder="contacto@tuempresa.com"
                value={businessInfo.companyEmail || ''}
                onChange={handleInputChange}
              />
            </div>
            
             <div className="space-y-1.5">
              <Label htmlFor="websiteUrl">Página Web</Label>
              <Input 
                id="websiteUrl" 
                name="websiteUrl"
                type="url" 
                placeholder="https://www.tuempresa.com"
                value={businessInfo.websiteUrl || ''}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyAddress">Dirección de la Empresa</Label>
              <Textarea 
                id="companyAddress" 
                name="companyAddress"
                placeholder="Calle Falsa 123, Colonia Centro, Ciudad, Estado, CP"
                value={businessInfo.companyAddress || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="openingHours">Horarios de Atención</Label>
              <Textarea 
                id="openingHours" 
                name="openingHours"
                placeholder="Lunes a Viernes: 9am - 6pm&#x0a;Sábados: 10am - 2pm"
                value={businessInfo.openingHours || ''}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
        </div>
        </ScrollArea>
        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isProcessing} className={cn("bg-brand-gradient text-primary-foreground hover:opacity-90")}>
            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessInfoDialog;
