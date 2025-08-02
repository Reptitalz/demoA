"use client";

import React, { useState, Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUser, FaKey, FaWhatsapp } from 'react-icons/fa';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog'; // Import the new dialog
import Link from 'next/link';

function ProfilePageContent() {
    const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    return (
        <>
            <PageContainer className="space-y-6">
                <div className="animate-fadeIn">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Perfil y Soporte</h2>
                    <p className="text-sm text-muted-foreground">Administra tu información personal y obtén ayuda.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="animate-fadeIn" style={{ animationDelay: "0.1s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaUser /> Información Personal</CardTitle>
                            <CardDescription>Visualiza y actualiza tus datos personales y de facturación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setIsPersonalInfoOpen(true)}>
                                Editar Información Personal
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="animate-fadeIn border-destructive/50" style={{ animationDelay: "0.2s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><FaKey /> Seguridad</CardTitle>
                            <CardDescription>Si olvidaste tu contraseña, puedes iniciar el proceso de recuperación aquí.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button variant="destructive" onClick={() => setIsForgotPasswordOpen(true)}>
                                Restablecer Contraseña
                           </Button>
                        </CardContent>
                    </Card>
                    
                    <Card className="animate-fadeIn lg:col-span-2" style={{ animationDelay: "0.3s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaWhatsapp /> Soporte Técnico</CardTitle>
                            <CardDescription>¿Necesitas ayuda o tienes alguna pregunta? Contáctanos directamente por WhatsApp.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                                <Link href="https://wa.me/5213344090167" target="_blank" rel="noopener noreferrer">
                                    <FaWhatsapp className="mr-2" /> Contactar a Soporte
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
            
            <PersonalInfoDialog isOpen={isPersonalInfoOpen} onOpenChange={setIsPersonalInfoOpen} />
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
