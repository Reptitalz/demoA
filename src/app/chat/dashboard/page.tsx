// src/app/chat/dashboard/page.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaSearch, FaRobot, FaUser, FaPlus, FaTrash, FaTimesCircle, FaHdd, FaDollarSign } from 'react-icons/fa';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn, formatBytes } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import AddChatDialog from '@/components/chat/AddChatDialog';
import AppIcon from '@/components/shared/AppIcon';
import CreditDetailsDialog from '@/components/chat/CreditDetailsDialog';
import { XCircle, Settings, Banknote, Package } from 'lucide-react';
import DefineShowDialog from '@/components/chat/DefineShowDialog';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ShowOption = 'credit' | 'bank' | 'products' | 'none';

const AssistantStatusBadge = ({ assistant }: { assistant: AssistantConfig }) => {
    if (assistant.isPlanActive) {
      return (
        <Badge variant="default" className="bg-primary/80 text-[10px] h-4">
          <FaUser className="mr-1 h-2.5 w-2.5" /> Plan Activo
        </Badge>
      );
    }
    return null;
};

// --- IndexedDB Helper ---
const DB_NAME = 'HeyManitoChatDB';
const DB_VERSION = 1;
const MESSAGES_STORE_NAME = 'messages';
const SESSION_STORE_NAME = 'session';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
        db.createObjectStore(MESSAGES_STORE_NAME, { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
        db.createObjectStore(SESSION_STORE_NAME, { keyPath: 'chatPath' });
      }
    };
  });
};


export default function ChatListPage() {
  const { data: session } = useSession();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { userProfile } = state;
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = React.useState(false);
  const [isCreditDetailsOpen, setIsCreditDetailsOpen] = React.useState(false);
  const [isDefineShowOpen, setIsDefineShowOpen] = React.useState(false);
  const [selectedShow, setSelectedShow] = React.useState<ShowOption>('credit');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [assistantToDelete, setAssistantToDelete] = React.useState<AssistantConfig | null>(null);
  
  const [activeSwipe, setActiveSwipe] = React.useState<{ id: string; direction: 'left' | 'right' } | null>(null);

  const dragOccurred = React.useRef(false);

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

  // If not authenticated, always add the demo assistant to the list.
  if (!userProfile.isAuthenticated) {
      availableChats = [demoAssistant, ...availableChats];
  }
  
  const handleAddNewContact = () => {
    setIsAddChatDialogOpen(true);
  };
  
  const showOptions: Record<ShowOption, { icon: React.ElementType, title: string, value: string, action: () => void, requiresAttention: boolean } | null> = {
    credit: { icon: FaDollarSign, title: "Crédito Disponible", value: "$500.00", action: () => setIsCreditDetailsOpen(true), requiresAttention: false },
    bank: { icon: Banknote, title: "Ganancia en Banco", value: "$1,250.00", action: () => router.push('/chat/admin'), requiresAttention: true },
    products: { icon: Package, title: "Productos por Recolectar", value: "3", action: () => router.push('/chat/admin'), requiresAttention: true },
    none: null,
  };
  const currentShow = showOptions[selectedShow];

  const handleClearConversation = async (chatPath: string) => {
    try {
        const db = await openDB();
        const sessionTx = db.transaction(SESSION_STORE_NAME, 'readonly');
        const sessionStore = sessionTx.objectStore(SESSION_STORE_NAME);
        const sessionReq = sessionStore.get(chatPath);

        sessionReq.onsuccess = () => {
            const sessionData = sessionReq.result;
            if (sessionData && sessionData.sessionId) {
                const sessionId = sessionData.sessionId;
                const messagesTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
                const messagesStore = messagesTx.objectStore(MESSAGES_STORE_NAME);
                const cursorReq = messagesStore.openCursor();
                
                cursorReq.onsuccess = (e) => {
                    const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                    if (cursor) {
                        if (cursor.value.sessionId === sessionId) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        toast({
                            title: 'Conversación Limpiada',
                            description: `Se borró el historial del chat para ${chatPath}.`,
                        });
                        setActiveSwipe(null);
                    }
                };
                 cursorReq.onerror = () => {
                    throw new Error('No se pudo iterar sobre los mensajes.');
                };
            } else {
                 toast({
                    title: 'Sin Historial',
                    description: `No se encontró un historial para limpiar.`,
                });
                setActiveSwipe(null);
            }
        };
        sessionReq.onerror = () => {
            throw new Error('No se pudo encontrar la sesión del chat.');
        };

    } catch (error: any) {
        console.error("Error clearing conversation:", error);
        toast({
            title: 'Error al Limpiar',
            description: error.message || 'No se pudo limpiar la conversación.',
            variant: 'destructive',
        });
    }
  };
  
  const handleDeleteAssistant = (assistant: AssistantConfig) => {
    setAssistantToDelete(assistant);
    setIsDeleteAlertOpen(true);
  };
  
  const confirmDelete = () => {
      if (!assistantToDelete) return;
      dispatch({ type: 'REMOVE_ASSISTANT', payload: assistantToDelete.id });
      toast({
          title: "Asistente Eliminado",
          description: `El asistente "${assistantToDelete.name}" ha sido eliminado.`,
      });
      setIsDeleteAlertOpen(false);
      setAssistantToDelete(null);
      setActiveSwipe(null);
  };


  return (
    <>
    <div className="flex flex-col h-full bg-transparent relative" onClick={() => setActiveSwipe(null)}>
      <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <AppIcon className="h-7 w-7" />
                <span>{APP_NAME}</span>
            </h1>
             <div className="flex items-center gap-4">
                {currentShow ? (
                     <div 
                        className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={currentShow.action}
                     >
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                            <span className={cn(
                                "relative flex h-2 w-2",
                                currentShow.requiresAttention && "animate-pulse"
                            )}>
                                <span className={cn(
                                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                                    currentShow.requiresAttention ? "bg-red-400" : "bg-green-400"
                                )}></span>
                                <span className={cn(
                                    "relative inline-flex rounded-full h-2 w-2",
                                    currentShow.requiresAttention ? "bg-red-500" : "bg-green-500"
                                )}></span>
                            </span>
                            <p className="text-xs text-muted-foreground">{currentShow.title}</p>
                            </div>
                            <p className="font-bold text-lg">{currentShow.value}</p>
                        </div>
                    </div>
                ) : null}
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsDefineShowOpen(true); }} className="h-8 w-8">
                   <Settings className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="relative mt-2">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar chats..." 
              className="pl-10 bg-background/50" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </header>

      <ScrollArea className="flex-grow" onClick={() => setActiveSwipe(null)}>
        <div className="p-2 space-y-2">
          {availableChats.length > 0 ? availableChats.map((chat) => {
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
                            <Button 
                                variant="ghost" 
                                className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(chat.chatPath) {
                                      handleClearConversation(chat.chatPath);
                                    }
                                }}
                            >
                                <XCircle size={20}/>
                                <span className="text-xs mt-1">Limpiar</span>
                            </Button>
                            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none" onClick={(e) => { e.stopPropagation(); handleDeleteAssistant(chat)}}>
                                <FaTrash size={20}/>
                                <span className="text-xs mt-1">Borrar</span>
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
                            <Button variant="ghost" className="h-full w-28 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5">
                                <FaHdd size={20}/>
                                <span className="text-xs">Memoria</span>
                                <span className="text-[10px] font-bold">{formatBytes(123456)}</span>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
                 <motion.div
                    drag="x"
                    dragConstraints={{ left: -160, right: 112 }}
                    onDragStart={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = false;
                    }}
                    onDrag={(e) => {
                        e.stopPropagation();
                        dragOccurred.current = true;
                    }}
                    onDragEnd={(event, info) => {
                        setTimeout(() => { dragOccurred.current = false; }, 50);

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
                        if (dragOccurred.current) {
                            return;
                        }
                        setActiveSwipe(null);
                        router.push(`/chat/${chat.chatPath}`);
                    }}
                    animate={{ 
                        x: isLeftSwiped ? -160 : isRightSwiped ? 112 : 0 
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
                                    <AvatarImage src={chat.imageUrl} alt={chat.name} />
                                    <AvatarFallback className="text-lg bg-muted">
                                        {chat.name ? chat.name.charAt(0) : <FaUser />}
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
                <FaRobot className="mx-auto h-12 w-12 mb-4" />
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
            className="absolute bottom-4 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground"
            size="icon"
            title="Añadir nuevo contacto"
          >
            <FaPlus className="h-6 w-6" />
          </Button>
        
    </div>
    <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
    <CreditDetailsDialog
        isOpen={isCreditDetailsOpen}
        onOpenChange={setIsCreditDetailsOpen}
    />
    <DefineShowDialog
        isOpen={isDefineShowOpen}
        onOpenChange={setIsDefineShowOpen}
        onSelectShow={setSelectedShow}
    />
    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el asistente "{assistantToDelete?.name}" y todo su historial de chat asociado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssistantToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};