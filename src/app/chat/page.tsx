// src/app/chat/page.tsx
"use client";

import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FcGoogle } from 'react-icons/fc';
import { FaUser, FaPaperPlane, FaSignInAlt } from 'react-icons/fa';
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


  return (
    <div className="h-screen w-screen flex items-center justify-center bg-muted/30">
        <div className="w-full h-full max-w-4xl flex border rounded-lg shadow-2xl bg-card">
            {/* Sidebar */}
            <div className="w-1/3 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <header className="p-3 bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-between">
                    {session?.user ? (
                        <div className="flex items-center gap-2">
                            <Avatar>
                                <AvatarImage src={session.user.image || undefined} />
                                <AvatarFallback><FaUser /></AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm truncate">{session.user.name}</p>
                        </div>
                    ) : (
                        <Button onClick={handleGoogleSignIn} size="sm" variant="outline">
                            <FaSignInAlt className="mr-2"/>
                            Iniciar Sesión
                        </Button>
                    )}
                    <Input placeholder="Buscar chat..." className="bg-white dark:bg-slate-700 h-8 text-xs max-w-[150px]"/>
                </header>
                <ScrollArea className="flex-grow">
                    {/* Demo conversation */}
                    <p className="text-center text-xs text-muted-foreground p-4">
                        Tus chats aparecerán aquí.
                    </p>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="w-2/3 flex flex-col bg-slate-200 dark:bg-slate-800/50 relative">
                 <div className="absolute inset-0 chat-background" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-4">
                    <AppIcon className="h-20 w-20 text-muted-foreground/30 mb-4"/>
                    <h2 className="text-xl font-bold text-foreground">Bienvenido a Hey Manito Chat</h2>
                    <p className="text-muted-foreground">Selecciona una conversación para empezar a chatear.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatPage;
