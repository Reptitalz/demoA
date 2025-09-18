// src/app/chat/page.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';

// Demo data
const demoChats = [
  { id: 1, name: 'Asistente de Ventas', lastMessage: 'Perfecto, tu pedido ha sido confirmado.', lastActive: new Date('2024-07-30T10:30:00Z'), unread: 2, avatar: 'https://picsum.photos/seed/asst1/100' },
  { id: 2, name: 'Soporte Técnico', lastMessage: '¿Has intentado reiniciar el dispositivo?', lastActive: new Date('2024-07-30T09:15:00Z'), unread: 0, avatar: 'https://picsum.photos/seed/asst2/100' },
  { id: 3, name: 'Pastelería "Dulces Sueños"', lastMessage: '¡Claro! Tenemos pasteles de chocolate y fresa.', lastActive: new Date('2024-07-29T18:00:00Z'), unread: 0, avatar: 'https://picsum.photos/seed/asst3/100' },
];


const ChatListPage = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <AppIcon className="h-7 w-7"/>
            <span>{APP_NAME}</span>
        </h1>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar chats..." className="pl-10" />
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-2 space-y-1">
          {demoChats.map((chat) => (
            <div key={chat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.avatar} alt={chat.name} />
                <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-semibold truncate">{chat.name}</p>
                    <p className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(chat.lastActive, { locale: es, addSuffix: true })}</p>
                </div>
                <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                        <span className="flex items-center justify-center h-5 w-5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                            {chat.unread}
                        </span>
                    )}
                </div>
              </div>
            </div>
          ))}
          
           {demoChats.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>No tienes chats activos.</p>
                    <p className="text-sm">Inicia una conversación con un asistente para verla aquí.</p>
                </div>
           )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatListPage;
