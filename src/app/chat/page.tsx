
// src/app/chat/page.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquarePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { APP_NAME } from '@/config/appConfig';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import AddChatDialog from '@/components/chat/AddChatDialog';
import AppIcon from '@/components/shared/AppIcon';
import { useApp } from '@/providers/AppProvider';
import { Bot } from 'lucide-react';
import type { AssistantConfig } from '@/types';


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
        <div className="p-2 space-y-1">
          {availableChats.length > 0 ? availableChats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.chatPath}`} legacyBehavior>
                <a className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.imageUrl} alt={chat.name} />
                        <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold truncate">{chat.name}</p>
                            <p className="text-xs text-muted-foreground shrink-0">Ahora</p>
                        </div>
                        <div className="flex justify-between items-start">
                            <p className="text-sm text-muted-foreground truncate">Haz clic para iniciar un chat...</p>
                        </div>
                    </div>
                </a>
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
