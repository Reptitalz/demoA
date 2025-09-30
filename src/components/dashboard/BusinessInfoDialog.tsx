"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaBuilding, FaEnvelope, FaMapMarkerAlt, FaClock, FaGlobe, FaImage, FaBriefcase } from 'react-icons/fa';
import type { AssistantConfig, AssistantBusinessInfo } from '@/types';
import Image from 'next/image';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';

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
    if (!businessInfo.vertical || !assistantName) {
      toast({
        title: "Campos Requeridos",
        description: "Por favor, especifica el nombre del asistente y la categoría del negocio.",
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
    
    // First, update the state and our own DB
    dispatch({ type: 'UPDATE_ASSISTANT', payload: updatedAssistant });
    
    toast({
      title: "Información Guardada",
      description: `La información de negocio para "${assistant.name}" ha sido actualizada en la plataforma.`,
    });

    // If the assistant is active and has Gupshup credentials, call the API to update WA profile
    if (assistant.numberReady && assistant.gupshupConfig?.appId && assistant.gupshupConfig?.apiKey) {
      try {
        const response = await fetch('/api/assistants/update-business-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assistantId: assistant.id,
              businessInfo: businessInfo
            })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Error al sincronizar con WhatsApp.");
        }
        
        toast({
          title: "¡Perfil de WhatsApp Sincronizado!",
          description: "La información de tu negocio se ha actualizado en WhatsApp.",
        });

      } catch (error: any) {
        toast({
          title: "Error de Sincronización con WhatsApp",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    
    setIsProcessing(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaBuilding /> Editar Información de "{assistant.name}"
          </DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu negocio. Esta información puede ser utilizada por tu asistente y se mostrará en su perfil de WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="assistant-image" className="flex items-center gap-2">
              <FaImage /> Imagen de Perfil
            </Label>
            <div className="flex items-center gap-4">
              <Image 
                src={assistantImageUrl}
                alt="Avatar del Asistente"
                width={80}
                height={80}
                className="rounded-md border object-cover"
                unoptimized
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Cambiar Imagen
              </Button>
              <Input 
                id="assistant-image"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
              />
            </div>
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="assistantName" className="flex items-center gap-2">
              <FaBuilding /> Nombre del Asistente/Negocio
            </Label>
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

          <div className="space-y-2">
            <Label htmlFor="vertical" className="flex items-center gap-2">
              <FaBriefcase /> Categoría del Negocio (Vertical)
            </Label>
            <Input 
              id="vertical" 
              name="vertical" 
              type="text"
              placeholder="Ej: Ropa, Restaurante, Educación, etc."
              value={businessInfo.vertical || ''}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail" className="flex items-center gap-2">
              <FaEnvelope /> Correo de la Empresa
            </Label>
            <Input 
              id="companyEmail" 
              name="companyEmail" 
              type="email"
              placeholder="contacto@tuempresa.com"
              value={businessInfo.companyEmail || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress" className="flex items-center gap-2">
              <FaMapMarkerAlt /> Dirección de la Empresa
            </Label>
            <Textarea 
              id="companyAddress" 
              name="companyAddress"
              placeholder="Calle Falsa 123, Colonia Centro, Ciudad, Estado, CP"
              value={businessInfo.companyAddress || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="openingHours" className="flex items-center gap-2">
              <FaClock /> Horarios de Atención
            </Label>
            <Textarea 
              id="openingHours" 
              name="openingHours"
              placeholder="Lunes a Viernes: 9am - 6pm&#x0a;Sábados: 10am - 2pm"
              value={businessInfo.openingHours || ''}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <FaGlobe /> Página Web
            </Label>
            <Input 
              id="websiteUrl" 
              name="websiteUrl"
              type="url" 
              placeholder="https://www.tuempresa.com"
              value={businessInfo.websiteUrl || ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? <FaSpinner className="animate-spin mr-2" /> : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessInfoDialog;
