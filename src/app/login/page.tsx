
"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FaGoogle } from 'react-icons/fa';
import { UserPlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from '@/config/appConfig';
import { auth, googleProvider, signInWithRedirect } from '@/lib/firebase';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const LoginPageContent = () => {
    const { state, dispatch } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);

    // Redirect authenticated users to the dashboard
    useEffect(() => {
        if (!state.isLoading && state.userProfile.isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [state.isLoading, state.userProfile.isAuthenticated, router]);

    // Parallax effect for the card
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!cardRef.current) return;
            const { clientX, clientY, currentTarget } = e;
            const { left, top, width, height } = (currentTarget as HTMLElement).getBoundingClientRect();
            const x = (clientX - left - width / 2) / 25;
            const y = (clientY - top - height / 2) / 25;
            cardRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
        };
        const container = document.getElementById('login-page-container');
        container?.addEventListener('mousemove', handleMouseMove);
        return () => container?.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleLogin = async () => {
        if (!googleProvider) {
            toast({ title: "Configuración Incompleta", description: "La autenticación de Firebase no está configurada.", variant: "destructive" });
            return;
        }
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            toast({ title: "Error de Autenticación", description: error.message || "No se pudo iniciar sesión con Google.", variant: "destructive" });
        }
    };

    const handleStartSetup = () => {
        dispatch({ type: 'RESET_WIZARD' });
        router.push('/app?action=add');
    };

    if (state.isLoading || state.userProfile.isAuthenticated) {
        return (
            <PageContainer className="flex items-center justify-center">
                <LoadingSpinner size={36} />
            </PageContainer>
        );
    }

    return (
        <PageContainer 
            id="login-page-container"
            className="flex items-center justify-center min-h-[calc(100vh-200px)]"
            style={{ perspective: '1000px' }}
        >
            <div ref={cardRef} className="transition-transform duration-200 ease-out">
                <Card className="w-full max-w-md mx-auto shadow-2xl animate-fadeIn p-4 sm:p-6 border-primary/20 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-brand-gradient">
                            Bienvenido/a a {APP_NAME}
                        </CardTitle>
                        <CardDescription className="pt-2 text-sm">
                            Inicia sesión para acceder a tu panel o crea tu primer asistente inteligente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 pt-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full justify-center text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
                            onClick={handleLogin}
                        >
                            <FaGoogle className="mr-3 h-5 w-5 text-primary" />
                            Iniciar con Google
                        </Button>
                        <Button
                            size="lg"
                            className="w-full justify-center text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105 bg-brand-gradient text-primary-foreground hover:opacity-90"
                            onClick={handleStartSetup}
                        >
                            <UserPlus className="mr-3 h-5 w-5" />
                            Crear Asistente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};


const LoginPage = () => {
    return (
        <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-[calc(100vh-150px)]">
                <LoadingSpinner size={36} />
            </PageContainer>
        }>
            <LoginPageContent />
        </Suspense>
    );
};

export default LoginPage;

    