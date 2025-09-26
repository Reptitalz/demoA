
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
        router.push('/chat/begin');
    };

    return (
        <div className="flex flex-col h-full text-center p-4 animate-fadeIn">
            <div className="flex-grow flex flex-col items-center justify-center">
                <AppIcon className="h-20 w-20 mb-4" />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                    Bienvenido a <span className="text-brand-gradient">Hey Manito! Chat</span>
                </h1>
                <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
                    Tu centro de mando para conversaciones inteligentes. Inicia sesión para acceder a tus asistentes o empieza a crear uno nuevo.
                </p>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-card/80 backdrop-blur-sm z-10">
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
                    <Button 
                        size="lg" 
                        className="w-full py-6 bg-brand-gradient text-primary-foreground hover:opacity-90"
                        onClick={handleStart}
                    >
                        Empezar <ArrowRight className="ml-2" />
                    </Button>
                    <Button 
                        size="lg" 
                        variant="outline" 
                        className="w-full py-6"
                        onClick={handleGoogleSignIn}
                    >
                        <FcGoogle className="mr-3 h-6 w-6" /> ¿Ya tienes cuenta?
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatLandingPage;
