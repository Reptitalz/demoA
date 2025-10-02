// src/app/chat/dashboard/page.tsx
"use client";

import React, { useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaSearch, FaRobot, FaUser, FaPlus, FaTrash, FaHdd, FaDollarSign, FaShareAlt } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, Contact } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn, formatBytes } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import AddChatDialog from '@/components/chat/AddChatDialog';
import AppIcon from '@/components/shared/AppIcon';
import CreditDetailsDialog from '@/components/chat/CreditDetailsDialog';
import { XCircle, Settings, Banknote, Package, MessageSquare } from 'lucide-react';
import DefineShowDialog from '@/components/chat/DefineShowDialog';
import { useToast } from '@/hooks/use-toast';
import { useContacts } from '@/hooks/useContacts';
import { useAssistants } from '@/hooks/useAssistants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


type ShowOption = 'credit' | 'bank' | 'products' | 'none';

// --- CHAT ITEM COMPONENT ---
interface ChatItemProps {
  chat: AssistantConfig | Contact;
  onSwipe: (id: string, direction: 'left' | 'right') => void;
  onClear: (id: string) => void;
  onDelete: (id: string) => void;
  activeSwipe: { id: string; direction: 'left' | 'right' } | null;
  setActiveSwipe: (swipe: { id: string; direction: 'left' | 'right' } | null) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onSwipe, onClear, onDelete, activeSwipe, setActiveSwipe }) => {
  const router = useRouter();
  const dragOccurred = React.useRef(false);

  const isAssistant = 'purposes' in chat;
  const isLeftSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'left';
  const isRightSwiped = activeSwipe?.id === chat.id && activeSwipe?.direction === 'right';
  const chatPath = 'chatPath' in chat ? chat.chatPath : (chat as Contact).chatPath;

  return (
    <div className="relative rounded-lg overflow-hidden bg-muted/30">
      <AnimatePresence>
        {isLeftSwiped && (
          <motion.div
            key="actions-left"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-y-0 right-0 flex items-center"
          >
            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none" onClick={(e) => { e.stopPropagation(); onClear(chatPath); }}>
              <XCircle size={20}/>
              <span className="text-xs mt-1">Limpiar</span>
            </Button>
            <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none" onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}>
              <FaTrash size={20}/>
              <span className="text-xs mt-1">Borrar</span>
            </Button>
          </motion.div>
        )}
        {isRightSwiped && (
          <motion.div
            key="actions-right"
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-y-0 left-0 flex items-center"
          >
             <Button variant="ghost" className="h-full w-28 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none gap-0.5">
                <FaHdd size={20}/>
                <span className="text-xs">Memoria</span>
                <span className="text-[10px] font-bold">{formatBytes(0)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 112 }}
        onDragStart={(e) => { e.stopPropagation(); dragOccurred.current = false; }}
        onDrag={(e) => { e.stopPropagation(); dragOccurred.current = true; }}
        onDragEnd={(event, info) => {
          setTimeout(() => { dragOccurred.current = false; }, 50);
          const isSwipeLeft = info.offset.x < -60;
          const isSwipeRight = info.offset.x > 60;
          if (isSwipeLeft) onSwipe(chat.id, 'left');
          else if (isSwipeRight) onSwipe(chat.id, 'right');
          else setActiveSwipe(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (dragOccurred.current) return;
          setActiveSwipe(null);
          router.push(`/chat/${chatPath}`);
        }}
        animate={{ x: isLeftSwiped ? -160 : isRightSwiped ? 112 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg">
          <CardContent className="p-3 flex items-center gap-3">
            <motion.div animate={{ y: [-1, 1, -1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <Avatar className="h-12 w-12 border-2 border-primary/30">
                <AvatarImage src={chat.imageUrl} alt={chat.name} />
                <AvatarFallback className="text-lg bg-muted">
                  {chat.name ? chat.name.charAt(0) : (isAssistant ? <FaRobot /> : <FaUser />)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-grow overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="font-semibold truncate text-sm">{chat.name}</p>
                {isAssistant && (chat as AssistantConfig).isActive && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">{isAssistant ? 'Tu Asistente' : (chat as Contact).lastMessage || "Inicia una conversación"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">{(chat as Contact).lastMessageTimestamp ? new Date((chat as Contact).lastMessageTimestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default function ChatListPage() {
  const { data: session } = useSession();
  const { state } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeSwipe, setActiveSwipe] = React.useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  
  // Dialog states
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = React.useState(false);
  const [isCreditDetailsOpen, setIsCreditDetailsOpen] = React.useState(false);
  const [isDefineShowOpen, setIsDefineShowOpen] = React.useState(false);
  const [selectedShow, setSelectedShow] = React.useState<ShowOption>('none');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<{ id: string; type: 'assistant' | 'contact' } | null>(null);

  const { assistants, removeAssistant } = useAssistants();
  const { contacts, removeContact, clearContactChat, addContact } = useContacts();

  const filteredAssistants = useMemo(() => assistants.filter(asst => asst.name.toLowerCase().includes(searchTerm.toLowerCase())), [assistants, searchTerm]);
  const filteredContacts = useMemo(() => contacts.filter(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase())), [contacts, searchTerm]);

  // Handle adding contact from URL
  useEffect(() => {
    const contactPath = searchParams.get('contact');
    if (contactPath && !contacts.some(c => c.chatPath === contactPath)) {
        toast({ title: "Agregando Contacto...", description: `Buscando usuario con ID: ${contactPath}` });
        
        fetch(`/api/assistants/public?chatPath=${encodeURIComponent(contactPath)}`)
            .then(res => {
                if (!res.ok) throw new Error('No se encontró a nadie con ese ID.');
                return res.json();
            })
            .then(data => {
                const userAsContact = data.assistant; // The endpoint returns a user/assistant profile
                addContact({
                    chatPath: userAsContact.chatPath,
                    name: userAsContact.name,
                    imageUrl: userAsContact.imageUrl,
                });
                toast({ title: "Contacto Agregado", description: `Has añadido a "${userAsContact.name}".` });
                router.replace('/chat/dashboard'); // Clean URL
            })
            .catch(error => {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
                router.replace('/chat/dashboard'); // Clean URL
            });
    }
  }, [searchParams, contacts, addContact, toast, router]);
  
  const handleShareProfile = async () => {
    if (!state.userProfile.isAuthenticated || !state.userProfile.chatPath) {
        toast({ title: "Inicia Sesión", description: "Debes iniciar sesión para compartir tu perfil.", variant: "default" });
        router.push('/chat');
        return;
    }

    const shareUrl = `${window.location.origin}/chat/dashboard?contact=${state.userProfile.chatPath}`;
    const shareData = {
        title: `Chatea conmigo en ${APP_NAME}`,
        text: `¡Hola! Agrégameme como contacto en ${APP_NAME} para que podamos chatear.`,
        url: shareUrl,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: "Enlace Copiado", description: "Tu enlace de perfil ha sido copiado al portapapeles." });
        }
    } catch (err) {
        toast({ title: "Error", description: "No se pudo compartir o copiar tu enlace de perfil.", variant: "destructive" });
    }
  };

  const showOptions: Record<ShowOption, { icon: React.ElementType, title: string, value: string, action: () => void, requiresAttention: boolean } | null> = {
    credit: { icon: FaDollarSign, title: "Crédito Disponible", value: "$500.00", action: () => setIsCreditDetailsOpen(true), requiresAttention: false },
    bank: { icon: Banknote, title: "Ganancia en Banco", value: "$1,250.00", action: () => router.push('/chat/admin'), requiresAttention: true },
    products: { icon: Package, title: "Productos por Recolectar", value: "3", action: () => router.push('/chat/admin'), requiresAttention: true },
    none: null,
  };
  const currentShow = showOptions[selectedShow];

  const handleDelete = (id: string, type: 'assistant' | 'contact') => {
    setItemToDelete({ id, type });
    setIsDeleteAlertOpen(true);
  };
  
  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'assistant') {
        removeAssistant(itemToDelete.id);
        toast({ title: "Asistente Eliminado", description: "El asistente ha sido eliminado." });
    } else {
        removeContact(itemToDelete.id);
        toast({ title: "Contacto Eliminado", description: "El contacto ha sido eliminado." });
    }
    setIsDeleteAlertOpen(false);
    setItemToDelete(null);
    setActiveSwipe(null);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-transparent relative" onClick={() => setActiveSwipe(null)}>
        <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold flex items-center gap-2"><AppIcon className="h-7 w-7" /><span>{APP_NAME}</span></h1>
                <div className="flex items-center gap-4">
                  {currentShow && (
                    <div className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50" onClick={currentShow.action}>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={cn("relative flex h-2 w-2", currentShow.requiresAttention && "animate-pulse")}>
                                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", currentShow.requiresAttention ? "bg-red-400" : "bg-green-400")}></span>
                                <span className={cn("relative inline-flex rounded-full h-2 w-2", currentShow.requiresAttention ? "bg-red-500" : "bg-green-500")}></span>
                            </span>
                            <p className="text-xs text-muted-foreground">{currentShow.title}</p>
                          </div>
                          <p className="font-bold text-lg">{currentShow.value}</p>
                        </div>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsDefineShowOpen(true); }} className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="relative mt-2">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar chats..." className="pl-10 bg-background/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
        </header>

        <ScrollArea className="flex-grow" onClick={() => setActiveSwipe(null)}>
          <div className="p-2 space-y-4">
            {filteredAssistants.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase text-muted-foreground px-2">Mis Asistentes</h2>
                {filteredAssistants.map(chat => (
                  <ChatItem key={chat.id} chat={chat} onSwipe={setActiveSwipe} onClear={clearContactChat} onDelete={(id) => handleDelete(id, 'assistant')} activeSwipe={activeSwipe} setActiveSwipe={setActiveSwipe} />
                ))}
              </div>
            )}
            {filteredContacts.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase text-muted-foreground px-2">Contactos</h2>
                {filteredContacts.map(chat => (
                  <ChatItem key={chat.chatPath} chat={chat} onSwipe={setActiveSwipe} onClear={clearContactChat} onDelete={(id) => handleDelete(id, 'contact')} activeSwipe={activeSwipe} setActiveSwipe={setActiveSwipe} />
                ))}
              </div>
            )}
            {filteredAssistants.length === 0 && filteredContacts.length === 0 && (
              <div className="text-center py-20 px-4 text-muted-foreground"><MessageSquare className="mx-auto h-12 w-12 mb-4" /><p className="font-semibold">No tienes chats.</p><p className="text-sm">{searchTerm ? "Intenta con otra búsqueda." : "Añade un contacto o crea un asistente para empezar."}</p></div>
            )}
          </div>
        </ScrollArea>
        
        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-3">
             <Button onClick={handleShareProfile} className="h-14 w-14 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white" size="icon" title="Compartir mi perfil">
                <FaShareAlt className="h-6 w-6" />
            </Button>
            <Button onClick={() => setIsAddChatDialogOpen(true)} className="h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground" size="icon" title="Añadir nuevo contacto">
                <FaPlus className="h-6 w-6" />
            </Button>
        </div>
      </div>

      <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
      <CreditDetailsDialog isOpen={isCreditDetailsOpen} onOpenChange={setIsCreditDetailsOpen} />
      <DefineShowDialog isOpen={isDefineShowOpen} onOpenChange={setIsDefineShowOpen} onSelectShow={setSelectedShow} />
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el chat.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
