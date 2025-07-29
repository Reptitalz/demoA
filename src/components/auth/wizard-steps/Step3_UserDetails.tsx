
"use client";

import React from 'react';
import { useApp } from "@/providers/AppProvider";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Home } from 'lucide-react';
import type { UserAddress } from '@/types';

const Step3UserDetails = () => {
  const { state, dispatch } = useApp();
  const { firstName, lastName, email, address } = state.wizard;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: 'UPDATE_WIZARD_USER_DETAILS',
      payload: { field: name as keyof UserProfile, value }
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch({
      type: 'UPDATE_WIZARD_USER_DETAILS',
      payload: { field: 'address', value: { [name]: value } as UserAddress }
    });
  };

  return (
    <div className="w-full animate-fadeIn space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Completa tus Detalles</h3>
        <p className="text-sm text-muted-foreground">
          Esta información nos ayuda a verificar tu cuenta y mejorar la seguridad de los pagos.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" /> Nombre
            </Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Tu nombre"
              value={firstName}
              onChange={handleInputChange}
              aria-required="true"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" /> Apellido
            </Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Tu apellido"
              value={lastName}
              onChange={handleInputChange}
              aria-required="true"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" /> Correo Electrónico
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={handleInputChange}
            aria-required="true"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Home className="h-4 w-4" /> Dirección (Opcional)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input
                name="street_name"
                placeholder="Calle"
                value={address.street_name || ''}
                onChange={handleAddressChange}
            />
             <Input
                name="street_number"
                placeholder="Número"
                value={address.street_number || ''}
                onChange={handleAddressChange}
            />
             <Input
                name="zip_code"
                placeholder="Código Postal"
                value={address.zip_code || ''}
                onChange={handleAddressChange}
            />
             <Input
                name="city"
                placeholder="Ciudad"
                value={address.city || ''}
                onChange={handleAddressChange}
            />
          </div>
           <p className="text-xs text-muted-foreground pt-1">
            Proporcionar tu dirección mejora la tasa de aprobación de pagos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step3UserDetails;
