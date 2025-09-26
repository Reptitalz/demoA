// src/app/chat/dashboard/page.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Bot, User, MessageSquarePlus, Trash2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import AppIcon from '@/components/shared/AppIcon';
import AddChatDialog from '@/components/chat/AddChatDialog';

const AssistantStatusBadge = ({ assistant }: { assistant: AssistantConfig }) => {
    if (assistant.isPlanActive) {
      return (
        <Badge variant="default" className="bg-primary/80 text-[10px] h-4">
          <User className="mr-1 h-2.5 w-2.5" /> Plan Activo
        </Badge>
      );
    }
    return null;
};


const ChatListPage = () => {
  const { data: session } = useSession();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { userProfile } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);
  const dragConstraints = { left: -160, right: 0 };
  const isDragging = useRef(false);

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
      isFirstDesktopAssistant: true,
      trialStartDate: new Date().toISOString(),
  };

  if (availableChats.length === 0 && !userProfile.isAuthenticated) {
      availableChats = [demoAssistant];
  }
  
  const handleAddNewContact = () => {
    if (session) {
      setIsAddChatDialogOpen(true);
    } else {
      router.push('/login');
    }
  };


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
          {availableChats.length > 0 ? availableChats.map((chat) => {
            const isSwiped = activeSwipeId === chat.id;
            return (
            <div key={chat.id} className="relative rounded-lg overflow-hidden">
                <AnimatePresence>
                    {isSwiped && (
                         <motion.div
                            key="actions"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 right-0 flex items-center"
                        >
                            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-gray-500/20 hover:bg-gray-500/30 rounded-none">
                                <Trash2 size={20}/>
                                <span className="text-xs mt-1">Borrar</span>
                            </Button>
                             <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none">
                                <XCircle size={20}/>
                                <span className="text-xs mt-1">Limpiar</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                 <motion.div
                    drag="x"
                    dragConstraints={dragConstraints}
                    onDragStart={() => {
                        isDragging.current = true;
                    }}
                    onDragEnd={(event, info) => {
                        setTimeout(() => {
                            isDragging.current = false;
                        }, 100);

                        const isSwipe = Math.abs(info.offset.x) > 50;
                        if (isSwipe && info.offset.x < 0) {
                            setActiveSwipeId(chat.id);
                        } else {
                            setActiveSwipeId(null);
                        }
                    }}
                    onClick={() => {
                        if (!isDragging.current) {
                            router.push(`/chat/${chat.chatPath}`);
                        }
                    }}
                    animate={{ x: isSwiped ? dragConstraints.left : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative z-10 cursor-grab active:cursor-grabbing"
                >
                    <Card className="glow-card hover:shadow-primary/10 rounded-lg">
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
                                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center">
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
                 </motion.div>
            </div>
            )
          }) : (
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
       
          <Button
            onClick={handleAddNewContact}
            className="absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
            size="icon"
            title="Añadir nuevo contacto"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
        
    </div>
    <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
    </>
  );
};

export default ChatListPage;
