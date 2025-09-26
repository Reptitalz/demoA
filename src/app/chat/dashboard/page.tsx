// src/app/chat/dashboard/page.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquarePlus, Bot, Star, Crown, User } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AddChatDialog from '@/components/chat/AddChatDialog';
import AppIcon from '@/components/shared/AppIcon';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FaSpinner } from 'react-icons/fa';
import { APP_NAME } from '@/config/appConfig';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const AssistantStatusBadge = ({ assistant }: { assistant: AssistantConfig }) => {
    const trialDaysRemaining = assistant.trialStartDate ? 30 - differenceInDays(new Date(), new Date(assistant.trialStartDate)) : 0;
    const isTrialActive = assistant.type === 'desktop' && !!assistant.isFirstDesktopAssistant && trialDaysRemaining > 0;
    const isTrialExpired = assistant.type === 'desktop' && !!assistant.isFirstDesktopAssistant && trialDaysRemaining <= 0;

    if (isTrialActive) {
        return null; // Don't show any badge during free trial
    }

    let badgeText = "Inactivo";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let Icon = null;

    if (isTrialExpired && !assistant.isPlanActive) {
        badgeText = "Prueba Finalizada";
        badgeVariant = "destructive";
    } else if (assistant.isPlanActive) {
        badgeText = "Plan Activo";
        badgeVariant = "default";
        Icon = Star;
    } else if (assistant.isActive) {
        badgeText = "Activo";
        badgeVariant = "default";
    } else if (assistant.phoneLinked && !assistant.numberReady) {
        badgeText = "Activando";
        badgeVariant = "outline";
        Icon = () => <FaSpinner className="animate-spin" />;
    }
    
    if (badgeText === 'Inactivo' && assistant.type === 'desktop' && !assistant.isFirstDesktopAssistant && !assistant.isPlanActive) {
        return null; // Don't show inactive badge for non-trial desktop assistants without a plan
    }
    
    // Don't render if it's just the default "Activo" badge, as the "IA" badge will cover this.
    if (badgeText === "Activo") return null;

    return (
        <Badge variant={badgeVariant} className={cn("text-[10px] h-4", badgeVariant === 'default' && 'bg-primary/80')}>
            {Icon && <Icon className="mr-1 h-2.5 w-2.5" />}
            {badgeText}
        </Badge>
    );
};


const ChatListPage = () => {
  const { data: session } = useSession();
  const { state } = useApp();
  const { userProfile } = state;
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // We only care about desktop assistants that can be chatted with via the web UI.
  let availableChats = userProfile.assistants.filter(assistant => 
    assistant.type === 'desktop' && 
    assistant.chatPath &&
    assistant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const demoAssistant: AssistantConfig = {
      id: 'demo-asst-1',
      name: 'Asistente de Demostración',
      type: 'desktop',
      chatPath: 'demo-assistant',
      imageUrl: 'https://i.imgur.com/8p8Yf9u.png',
      isActive: true,
      numberReady: true,
      messageCount: 0,
      monthlyMessageLimit: 1000,
      purposes: [],
      isFirstDesktopAssistant: true, // For demo, show as if in trial
      trialStartDate: new Date().toISOString(),
  };

  // If no chats are available and user is not authenticated, show demo chat
  if (availableChats.length === 0 && !userProfile.isAuthenticated) {
      availableChats = [demoAssistant];
  }


  return (
    <>
    <div className="flex flex-col h-full bg-transparent relative">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <AppIcon className="h-7 w-7" />
            <span>{APP_NAME}</span>
        </h1>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar chats..." 
              className="pl-10 bg-background/50" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-2 space-y-2">
          {availableChats.length > 0 ? availableChats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.chatPath}`} legacyBehavior>
                <Card className="cursor-pointer glow-card hover:shadow-primary/10">
                    <CardContent className="p-3 flex items-center gap-3">
                         <motion.div
                            animate={{ y: [-1, 1, -1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                         >
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                                <AvatarImage src={chat.imageUrl} alt={chat.name} />
                                <AvatarFallback className="text-lg bg-muted">
                                    {chat.name ? chat.name.charAt(0) : <User />}
                                </AvatarFallback>
                            </Avatar>
                        </motion.div>
                        <div className="flex-grow overflow-hidden">
                           <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold truncate text-sm">{chat.name}</p>
                                     {state.userProfile.accountType === 'business' && (
                                         <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center -translate-y-1/2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                                                <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                                                <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                                            </svg>
                                        </Badge>
                                      )}
                                      {chat.isActive && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>
                                      )}
                                </div>
                                <AssistantStatusBadge assistant={chat} />
                           </div>
                           <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-muted-foreground">en línea</p>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">Ahora</p>
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
          )) : (
             <div className="text-center py-20 px-4 text-muted-foreground">
                <Bot className="mx-auto h-12 w-12 mb-4" />
                <p className="font-semibold">No tienes asistentes de escritorio.</p>
                <p className="text-sm">
                    {userProfile.isAuthenticated 
                      ? "Crea un nuevo asistente de escritorio para chatear aquí."
                      : "Inicia sesión para crear y chatear con tus asistentes."
                    }
                </p>
            </div>
           )}
        </div>
      </ScrollArea>
       {session && (
          <Button
            onClick={() => setIsAddChatDialogOpen(true)}
            className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
            size="icon"
            title="Iniciar chat con ID"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
        )}
    </div>
    <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
    </>
  );
};

export default ChatListPage;
