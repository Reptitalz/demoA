"use client";

import React, { useState, Suspense, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useApp } from '@/providers/AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserAddress, UserProfile } from '@/types';
import { FaSave, FaUser, FaEnvelope, FaMapMarkerAlt, FaKey } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';

function ProfilePageContent() {
    const { state, dispatch } = useApp();
    const { userProfile, isLoading } = state;
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: userProfile.email || '',
                address: userProfile.address || {},
            });
        }
    }, [userProfile]);

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
            // The toast will now be shown from AppProvider upon successful save
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
    
    if (isLoading) {
        return <LoadingSpinner size={36} />;
    }

    return (
        <>
            <PageContainer className="space-y-6">
                <div className="animate-fadeIn">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Perfil de Usuario</h2>
                    <p className="text-sm text-muted-foreground">Administra tu información personal y de facturación.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 animate-fadeIn" style={{animationDelay: "0.1s"}}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaUser /> Información Personal</CardTitle>
                            <CardDescription>Estos datos se utilizarán para la comunicación y la facturación.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 animate-fadeIn" style={{animationDelay: "0.2s"}}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaMapMarkerAlt /> Dirección de Facturación</CardTitle>
                            <CardDescription>Esta dirección aparecerá en tus facturas. Es opcional pero recomendada.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-3 flex justify-end animate-fadeIn" style={{animationDelay: "0.3s"}}>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaSave className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>

                    <Card className="lg:col-span-2 animate-fadeIn border-destructive/50" style={{animationDelay: "0.4s"}}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><FaKey /> Seguridad</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                           <CardDescription>
                                Si olvidaste tu contraseña o deseas cambiarla, puedes iniciar el proceso de recuperación.
                           </CardDescription>
                           <Button variant="destructive" onClick={() => setIsForgotPasswordOpen(true)}>
                                Restablecer Contraseña
                           </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
            <ForgotPasswordDialog isOpen={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
        </>
    );
}


export default function ProfilePage() {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}
