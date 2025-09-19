
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, MessageCircle, Code } from 'lucide-react';
import AppIcon from '@/components/shared/AppIcon';
import { cn } from '@/lib/utils';

// New component for the Dev app icon
const DevAppIcon = () => (
    <div className="relative h-8 w-8">
        <AppIcon className="text-black dark:text-white" />
        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow-md">
            <Code className="h-3 w-3 text-foreground" />
        </div>
    </div>
);

// New component for the Chat app icon
const ChatAppIcon = () => (
    <div className="relative h-8 w-8">
        <AppIcon className="text-black dark:text-white" />
        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow-md">
            <MessageCircle className="h-3 w-3 text-foreground" />
        </div>
    </div>
);


const StoreButton = ({ icon, title, subtitle, className, onClick }: { icon: React.ReactNode, title: string, subtitle: string, className?: string, onClick?: () => void }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto px-4 py-2 rounded-lg border border-border/20 shadow-sm flex items-center gap-3 w-full text-left transition-transform transform hover:scale-105",
        "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-gray-300",
        className
      )}
    >
      {icon}
      <div>
        <p className="text-xs font-normal leading-none">{title}</p>
        <p className="text-base font-bold leading-tight">{subtitle}</p>
      </div>
    </Button>
);


const AccessPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleAction = (appType: 'admin' | 'chat') => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
                if (choiceResult.outcome === 'accepted') {
                    toast({
                        title: "Aplicación Instalada",
                        description: `¡Gracias por instalar Hey Manito ${appType === 'admin' ? 'Admin' : 'Chat'}!`,
                    });
                }
                setDeferredInstallPrompt(null);
            });
        } else {
             // If PWA installation is not available, just navigate
            const path = appType === 'admin' ? '/dashboard' : '/chat';
            router.push(path);
        }
    };
    
    return (
        <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center animate-fadeIn">
            <AppIcon className="h-16 w-16 mb-4" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                Bienvenido a <span className="text-brand-gradient">Hey Manito</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">Elige cómo quieres acceder.</p>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin App Card */}
                <Card 
                    className="cursor-pointer transition-all border-2 border-transparent overflow-hidden shadow-lg hover:shadow-primary/20 glow-card"
                    onClick={() => handleAction('admin')}
                >
                    <CardHeader>
                        <div className="flex justify-center mb-3">
                            <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                                <Bot size={28} className="text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-xl">Hey Manito Admin</CardTitle>
                        <CardDescription>
                            Gestiona tus asistentes, bases de datos y configuraciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StoreButton
                            icon={<DevAppIcon />}
                            title="Disponible en"
                            subtitle="Hey Manito Admin"
                             className="bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black dark:hover:bg-gray-300"
                        />
                    </CardContent>
                </Card>

                {/* Chat App Card */}
                 <Card 
                    className="cursor-pointer transition-all border-2 border-transparent overflow-hidden shadow-lg hover:shadow-green-500/20 glow-card"
                    onClick={() => handleAction('chat')}
                >
                    <CardHeader>
                        <div className="flex justify-center mb-3">
                           <div className="p-3 bg-green-500/10 rounded-full border border-green-500/20">
                                <MessageCircle size={28} className="text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="text-xl">Hey Manito Chat</CardTitle>
                        <CardDescription>
                            Chatea con tus asistentes o inicia nuevas conversaciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StoreButton
                            icon={<ChatAppIcon />}
                            title="Disponible en"
                            subtitle="Hey Manito Chat"
                        />
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
};

export default AccessPage;
