
"use client";

import React, { useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Step2_UserDetails = () => {
  const { state, dispatch } = useApp();
  const { firstName, lastName, imageUrl } = state.wizard;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: 'UPDATE_WIZARD_USER_DETAILS',
      payload: { field: name as 'firstName' | 'lastName', value }
    });
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
        dispatch({
          type: 'UPDATE_WIZARD_USER_DETAILS',
          payload: { field: 'imageUrl', value: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="w-full max-w-md animate-fadeIn space-y-4 px-4 sm:px-0">
      <div className="text-center">
        <h3 className="text-xl font-semibold">¡Hola! ¿Cómo te llamas?</h3>
        <p className="text-sm text-muted-foreground">
          Personalicemos tu perfil. Esta información te identificará en la plataforma.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <div 
                className="relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
            >
                <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg">
                    <AvatarImage src={imageUrl} alt={firstName || 'Avatar'} />
                    <AvatarFallback className="text-3xl bg-muted">
                        {firstName ? firstName.charAt(0) : <User />}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="text-white h-8 w-8" />
                </div>
            </div>
            
            <Input 
                id="user-image"
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
            />
         
            <div className="space-y-2 flex-grow">
                <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Nombre de Usuario
                </Label>
                <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Tu nombre de usuario"
                    value={firstName}
                    onChange={handleInputChange}
                    aria-required="true"
                    className="py-6"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Step2_UserDetails;
