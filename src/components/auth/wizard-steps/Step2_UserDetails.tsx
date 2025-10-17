
"use client";

import React from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

const Step2_UserDetails = () => {
  const { state, dispatch } = useApp();
  const { firstName, imageUrl } = state.wizard;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: 'UPDATE_WIZARD_USER_DETAILS',
      payload: { field: name as 'firstName' | 'lastName', value }
    });
  };

  return (
    <div className="w-full max-w-md animate-fadeIn space-y-4 px-4 sm:px-0">
      <div className="text-center">
        <h3 className="text-xl font-semibold">¡Hola! ¿Cómo te llamas?</h3>
        <p className="text-sm text-muted-foreground">
          Elige un nombre de usuario. Esta información te identificará en la plataforma.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
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
                className="py-6 text-lg text-center"
            />
        </div>
      </div>
      
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10, delay: 0.2 }}
            className="mt-8"
        >
            <div className="bg-card p-4 rounded-xl shadow-lg border border-border/50 flex items-center gap-4 relative overflow-hidden glow-card">
                 <motion.div
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                 >
                    <Avatar className="h-14 w-14 border-2 border-primary/30">
                        <AvatarImage src={imageUrl || undefined} alt={firstName || 'Avatar'} />
                        <AvatarFallback className="text-xl bg-muted">
                            {firstName ? firstName.charAt(0) : <User />}
                        </AvatarFallback>
                    </Avatar>
                </motion.div>
                <div className="flex-grow">
                    <p className="font-semibold text-foreground truncate">{firstName || 'Tu Nombre'}</p>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-muted-foreground">en línea</p>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
  );
};

export default Step2_UserDetails;
