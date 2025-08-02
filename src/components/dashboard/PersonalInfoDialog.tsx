"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaSave, FaUser, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import type { UserAddress, UserProfile } from '@/types';
import { Loader2 } from 'lucide-react';

interface PersonalInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PersonalInfoDialog = ({ isOpen, onOpenChange }: PersonalInfoDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userProfile) {
        setFormData({
            firstName: userProfile.firstName || '',
            lastName: userProfile.lastName || '',
            email: userProfile.email || '',
            address: userProfile.address || {},
        });
    }
  }, [isOpen, userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        address: {
            ...(prev.address as UserAddress),
            [name]: value,
        },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        // The AppProvider's useEffect will automatically handle saving to the backend
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: formData });
        // The toast is shown from AppProvider upon successful save
        onOpenChange(false); // Close dialog on save
    } catch (error: any) {
        toast({
            title: 'Error al Guardar',
            description: error.message || 'No se pudieron guardar los cambios.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => { if (isSaving) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FaUser /> Información Personal</DialogTitle>
          <DialogDescription>Estos datos se utilizarán para la comunicación y la facturación.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleInputChange} />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-2"><FaEnvelope /> Correo Electrónico</Label>
                <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            </div>
            
            <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2"><FaMapMarkerAlt /> Dirección de Facturación</h4>
                <p className="text-xs text-muted-foreground">Esta dirección aparecerá en tus facturas. Es opcional pero recomendada.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="street_name">Calle</Label>
                        <Input id="street_name" name="street_name" value={formData.address?.street_name || ''} onChange={handleAddressChange} />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="street_number">Número</Label>
                        <Input id="street_number" name="street_number" value={formData.address?.street_number || ''} onChange={handleAddressChange} />
                    </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input id="city" name="city" value={formData.address?.city || ''} onChange={handleAddressChange} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="zip_code">Código Postal</Label>
                        <Input id="zip_code" name="zip_code" value={formData.address?.zip_code || ''} onChange={handleAddressChange} />
                    </div>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaSave className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalInfoDialog;
