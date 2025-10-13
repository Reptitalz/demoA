
"use client";

import React from 'react';
import PhoneInputLib, { type Country, type E164Number } from 'react-phone-number-input';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import 'react-phone-number-input/style.css'; // Import base styles

// Define the interface for the properties of the component
interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: E164Number | undefined;
  onChange: (value: E164Number | undefined) => void;
  defaultCountry?: Country;
  className?: string;
  disabled?: boolean;
}

// Use React.forwardRef to pass the ref to the underlying component
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <PhoneInputLib
        ref={ref}
        // Use a wrapper to apply styles, not the root component itself
        className={cn('phone-input-root', className)}
        // Use the Input component from shadcn as the input field
        inputComponent={Input}
        // Pass the rest of the properties
        {...props}
      />
    );
  }
);

// Assign a display name for better debugging
PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
