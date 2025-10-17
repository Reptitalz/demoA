
"use client";

import React, { useRef } from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Image as ImageIcon } from 'lucide-react';
import type { UserAddress, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Step3_UserDetails = () => {
  const { state, dispatch } = useApp();
  const { firstName, lastName, address, imageUrl } = state.wizard;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        <h3 className="text-xl font-semibold">Personaliza tu Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Elige una imagen de perfil para que tus contactos te reconozcan.
        </p>
      </div>

      <div className="space-y-6">
        <div 
            className="relative cursor-pointer group w-24 h-24 mx-auto"
            onClick={() => fileInputRef.current?.click()}
        >
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
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
      </div>
    </div>
  );
};

export default Step3_UserDetails;
