
"use client";

import React from 'react';
import PhoneInputLib, { type Country, type E164Number } from 'react-phone-number-input';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Definir la interfaz para las propiedades del componente
interface PhoneInputProps {
  value: E164Number | undefined;
  onChange: (value: E164Number | undefined) => void;
  defaultCountry?: Country;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  ['aria-required']?: boolean;
}

// Usar React.forwardRef para pasar la ref al componente subyacente
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <PhoneInputLib
        ref={ref}
        // Clases para el contenedor principal
        className={cn('phone-input-root', className)}
        // Usar el componente Input de shadcn como campo de entrada
        inputComponent={Input as React.ElementType}
        // Pasar el resto de las propiedades
        {...props}
      />
    );
  }
);

// Asignar un nombre de visualización para una mejor depuración
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
