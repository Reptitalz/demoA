
"use client";

import React, { useState, Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUser, FaKey, FaWhatsapp, FaPalette, FaEdit, FaQuestionCircle } from 'react-icons/fa';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import PersonalInfoDialog from '@/components/dashboard/PersonalInfoDialog';
import Link from 'next/link';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';

function ProfilePageContent() {
    const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    return (
        <>
            <PageContainer className="space-y-6">
                <div className="animate-fadeIn">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Perfil y Soporte</h2>
                    <p className="text-sm text-muted-foreground">Administra tu información, apariencia y obtén ayuda.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="animate-fadeIn transition-all hover:shadow-lg hover:border-primary/30" style={{ animationDelay: "0.1s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaUser className="text-primary"/> Información Personal</CardTitle>
                            <CardDescription>Actualiza tus datos personales y de facturación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => setIsPersonalInfoOpen(true)} className={cn("bg-brand-gradient text-primary-foreground hover:opacity-90")}>
                                <FaEdit /> Editar Información
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <Card className="animate-fadeIn transition-all hover:shadow-lg hover:border-destructive/50" style={{ animationDelay: "0.2s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><FaKey /> Seguridad</CardTitle>
                            <CardDescription>¿Olvidaste tu contraseña? Inicia el proceso de recuperación.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button variant="destructive" onClick={() => setIsForgotPasswordOpen(true)}>
                                <FaQuestionCircle /> Recuperar Contraseña
                           </Button>
                        </CardContent>
                    </Card>

                    <Card className="animate-fadeIn transition-all hover:shadow-lg hover:border-primary/30" style={{ animationDelay: "0.3s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaPalette className="text-primary"/> Apariencia</CardTitle>
                            <CardDescription>Elige entre el tema claro y el oscuro para la aplicación.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                           <ThemeToggle />
                           <span className="text-sm text-muted-foreground">Alternar tema</span>
                        </CardContent>
                    </Card>
                    
                    <Card className="animate-fadeIn transition-all hover:shadow-lg hover:border-green-500/30" style={{ animationDelay: "0.4s" }}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FaWhatsapp className="text-green-500"/> Soporte Técnico</CardTitle>
                            <CardDescription>¿Necesitas ayuda? Contáctanos por WhatsApp.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                                <Link href="https://wa.me/5213344090167" target="_blank" rel="noopener noreferrer">
                                    <FaWhatsapp /> Contactar a Soporte
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
