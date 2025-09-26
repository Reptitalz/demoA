// src/app/chat/admin/page.tsx
"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, User, Trash2, XCircle, HardDrive, Bot } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatBytes } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Demo data for admin chat trays
const demoAdminChats = [
    {
        id: 'user-1',
        name: 'Cliente A - Asistente de Ventas',
        status: 'en línea',
        lastMessage: 'Sí, me gustaría confirmar el pedido.',
        timestamp: 'Ahora',
        avatarUrl: 'https://i.imgur.com/8p8Yf9u.png',
        memory: 123456
    },
    {
        id: 'user-2',
        name: 'Usuario B - Asistente de Soporte',
        status: 'en línea',
        lastMessage: 'Gracias por la ayuda, se ha solucionado.',
        timestamp: 'Hace 5m',
        avatarUrl: 'https://i.imgur.com/8p8Yf9u.png',
        memory: 78910
    },
];

const AdminChatInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSwipe, setActiveSwipe] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const router = useRouter();
  const dragOccurred = useRef(false);

  const filteredChats = demoAdminChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
              <h1 className="text-xl font-bold">{APP_NAME} Admin</h1>
              <p className="text-sm text-muted-foreground">Supervisión de Chats</p>
          </div>
        </div>
        <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o asistente..."
              className="pl-10 bg-background/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>

      <ScrollArea className="flex-grow" onClick={() => setActiveSwipe(null)}>
         <div className="p-2 space-y-2">
          {filteredChats.length > 0 ? filteredChats.map((chat) => {
            const isLeftSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'left';
            const isRightSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'right';

            return (
              <div key={chat.id} className="relative rounded-lg overflow-hidden bg-muted/30">
                <AnimatePresence>
                    {isLeftSwiped && (
                        <motion.div
                            key="actions-left"
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
                    {isRightSwiped && (
                         <motion.div
                            key="actions-right"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-y-0 left-0 flex items-center"
                        >
                            <Button variant="ghost" className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5">
                                <HardDrive size={20}/>
                                <span className="text-xs">Memoria</span>
                                <span className="text-[10px] font-bold">{formatBytes(chat.memory)}</span>
                            </Button>
                            <Button variant="ghost" className="h-full w-24 flex flex-col items-center justify-center text-muted-foreground bg-green-500/20 hover:bg-green-500/30 rounded-none gap-0.5">
                                <Bot size={20}/>
                                <span className="text-xs">Activar IA</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -160, right: 192 }}
                    onDragStart={() => dragOccurred.current = false}
                    onDrag={() => dragOccurred.current = true}
                    onDragEnd={(event, info) => {
                        const isSwipeLeft = info.offset.x < -60;
                        const isSwipeRight = info.offset.x > 60;
                        if (isSwipeLeft) {
                            setActiveSwipe({ id: chat.id, direction: 'left' });
                        } else if (isSwipeRight) {
                             setActiveSwipe({ id: chat.id, direction: 'right' });
                        } else {
                            setActiveSwipe(null);
                        }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!dragOccurred.current) {
                           // This is a click, navigate to chat
                           // router.push(`/chat/admin/${chat.id}`); // Example path
                        }
                         // Reset drag flag after click check
                        setTimeout(() => { dragOccurred.current = false; }, 50);
                    }}
                    animate={{ 
                        x: isLeftSwiped ? -160 : isRightSwiped ? 192 : 0 
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative z-10 cursor-grab active:cursor-grabbing"
                >
                    <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg">
                        <CardContent className="p-3 flex items-center gap-3">
                            <motion.div
                                animate={{ y: [-1, 1, -1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <Avatar className="h-12 w-12 border-2 border-primary/30">
                                    <AvatarImage src={chat.avatarUrl} alt={chat.name} />
                                    <AvatarFallback className="text-lg bg-muted">
                                        {chat.name ? chat.name.charAt(0) : <User />}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>
                            <div className="flex-grow overflow-hidden">
                            <div className="flex items-center justify-between">
                                    <p className="font-semibold truncate text-sm">{chat.name}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">{chat.status}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">{chat.timestamp}</p>
                            </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
              </div>
            )
          }) : (
             <div className="text-center py-20 px-4 text-muted-foreground">
                <p className="font-semibold">No se encontraron chats.</p>
                <p className="text-sm">
                    {searchTerm ? "Intenta con otra búsqueda." : "Los chats activos de los clientes aparecerán aquí."}
                </p>
            </div>
           )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default function AdminPage() {
    return <AdminChatInterface />;
}
