
"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, LogIn, Phone, Key } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from '@/config/appConfig';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { PhoneInput } from '@/components/ui/phone-input';
import type { E164Number } from 'react-phone-number-input';
import { isValidPhoneNumber } from 'react-phone-number-input';


const LoginPageContent = () => {
    const { state, dispatch } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const cardRef = useRef<HTMLDivElement>(null);
    
    const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !isValidPhoneNumber(phoneNumber) || !password) {
            toast({ title: "Datos incompletos", description: "Por favor, ingresa un número de teléfono y contraseña válidos.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }
            
            // On successful login, AppProvider should take over
            dispatch({ type: 'SYNC_PROFILE_FROM_API', payload: data.userProfile });
            toast({ title: "¡Bienvenido/a de nuevo!", description: "Has iniciado sesión correctamente." });
            router.replace('/dashboard');

        } catch (error: any) {
            toast({ title: "Error de Autenticación", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
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
                    <CardContent className="space-y-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone-number" className="flex items-center gap-2"><Phone /> Número de Teléfono</Label>
                                <PhoneInput
                                  id="phone-number"
                                  placeholder="Tu número de teléfono"
                                  value={phoneNumber}
                                  onChange={(value) => setPhoneNumber(value)}
                                  defaultCountry="MX"
                                  disabled={isProcessing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password"><Key /> Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Tu contraseña segura"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isProcessing}
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full justify-center text-base py-6 transition-all duration-300 ease-in-out transform hover:scale-105"
                                disabled={isProcessing}
                            >
                                {isProcessing ? <LoadingSpinner size={20} /> : <LogIn className="mr-3 h-5 w-5" />}
                                Iniciar Sesión
                            </Button>
                        </form>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                O si eres nuevo
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
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
