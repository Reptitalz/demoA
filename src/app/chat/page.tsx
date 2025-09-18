// src/app/chat/page.tsx
"use client";

import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FcGoogle } from 'react-icons/fc';
import { FaUser, FaPaperPlane } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';
import { signIn, useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const ChatPage = () => {
    const { data: session, status } = useSession();
    const [message, setMessage] = useState('');

    const handleGoogleSignIn = () => {
        signIn('google');
    }

    if (status === "loading") {
        return (
             <PageContainer className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size={40} />
            </PageContainer>
        )
    }

    if (!session) {
        return (
            <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
                <div className="text-center">
                    <AppIcon className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Bienvenido a Hey Manito Chat</h1>
                    <p className="text-muted-foreground mt-2">Inicia sesión para ver y continuar tus conversaciones.</p>
                    <Button onClick={handleGoogleSignIn} className="mt-6">
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Iniciar Sesión con Google
                    </Button>
                </div>
            </PageContainer>
        )
    }


  return (
    <div className="h-screen w-screen flex items-center justify-center bg-muted/30">
        <div className="w-full h-full max-w-4xl flex border rounded-lg shadow-2xl bg-card">
            {/* Sidebar */}
            <div className="w-1/3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <header className="p-3 bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar>
                            <AvatarImage src={session.user?.image || undefined} />
                            <AvatarFallback><FaUser /></AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm truncate">{session.user?.name}</p>
                    </div>
                    <Input placeholder="Buscar chat..." className="bg-white dark:bg-slate-700 h-8 text-xs max-w-[150px]"/>
                </header>
                <ScrollArea className="flex-grow">
                    {/* Demo conversation */}
                    <div className="flex items-center gap-3 p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800/50">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="https://picsum.photos/seed/asst1/100" />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <p className="font-semibold truncate text-sm">Asistente de Ventas</p>
                            <p className="text-xs text-muted-foreground truncate">Perfecto, tu pedido ha sido...</p>
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="w-2/3 flex flex-col bg-slate-200 dark:bg-slate-800/50 relative">
                 <div className="absolute inset-0 chat-background" />
                <div className="relative h-full flex flex-col">
                    <header className="bg-white dark:bg-slate-900/80 p-3 flex items-center shadow-sm z-10 shrink-0 border-b border-slate-200 dark:border-slate-700">
                        <Avatar className="h-9 w-9 mr-3 border">
                            <AvatarImage src="https://picsum.photos/seed/asst1/100" />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold text-sm">Asistente de Ventas</h3>
                            <p className="text-xs text-green-500">en línea</p>
                        </div>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto">
                        <div className="flex justify-center my-4">
                            <p className="text-xs bg-muted/80 text-muted-foreground rounded-full px-3 py-1">Hoy</p>
                        </div>
                        {/* Placeholder messages */}
                        <div className="flex justify-end mb-3">
                            <div className="bg-[#dcf8c6] dark:bg-[#054740] rounded-lg p-2 max-w-xs shadow">
                                <p className="text-sm">Hola, ¿tienen servicio de catering?</p>
                            </div>
                        </div>
                         <div className="flex justify-start mb-3">
                            <div className="bg-white dark:bg-slate-700 rounded-lg p-2 max-w-xs shadow">
                                <p className="text-sm">¡Hola! Sí, ofrecemos servicio de catering. ¿Para qué tipo de evento y cuántas personas sería?</p>
                            </div>
                        </div>
                    </main>
                    <footer className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center gap-3 shrink-0 border-t border-slate-200 dark:border-slate-700">
                        <Input 
                            placeholder="Escribe un mensaje..." 
                            className="h-9 text-sm"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <Button size="icon" className="h-9 w-9" disabled={!message}>
                            <FaPaperPlane />
                        </Button>
                    </footer>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatPage;
