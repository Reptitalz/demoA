// src/app/chat/page.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { ArrowRight } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import AppIcon from '@/components/shared/AppIcon';

const ChatLandingPage = () => {
    const { toast } = useToast();
    const router = useRouter();

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl: '/chat/dashboard' }).catch(() => {
            toast({
                title: 'Error de Inicio de Sesión',
                description: 'No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.',
                variant: 'destructive'
            });
        });
    };
    
    const handleStart = () => {
        // Placeholder for the new multi-step process
        toast({
            title: 'Próximamente',
            description: 'El nuevo proceso de configuración se añadirá aquí.',
        });
        // router.push('/chat/setup'); // Example of where it might go
    };

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fadeIn">
            <AppIcon className="h-20 w-20 mb-4" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                Bienvenido a <span className="text-brand-gradient">Hey Manito! Chat</span>
            </h1>
            <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
                Tu centro de mando para conversaciones inteligentes. Inicia sesión para acceder a tus asistentes o empieza a crear uno nuevo.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button 
                    size="lg" 
                    className="w-full text-lg py-6 bg-brand-gradient text-primary-foreground hover:opacity-90"
                    onClick={handleStart}
                >
                    Empezar <ArrowRight className="ml-2" />
                </Button>
                <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full text-lg py-6"
                    onClick={handleGoogleSignIn}
                >
                    <FcGoogle className="mr-3 h-6 w-6" /> ¿Ya tienes cuenta?
                </Button>
            </div>
        </div>
    );
};

export default ChatLandingPage;
