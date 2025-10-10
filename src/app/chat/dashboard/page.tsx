
// src/app/chat/dashboard/page.tsx
"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp, FaBuilding, FaDollarSign, FaUserTie, FaUserShield } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, Contact, CreditLine, UserProfile } from '@/types';
import { cn, formatBytes } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { useRouter } from 'next/navigation';
import { Bot, CheckSquare, Package, Trash2, XCircle, HardDrive, CreditCard, Gem, User, Shield, Briefcase, Workflow } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import PlansDialog from '@/components/dashboard/PlansDialog';
import { useContacts } from '@/hooks/useContacts';
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
import AddChatDialog from '@/components/chat/AddChatDialog';
import { DEFAULT_ASSISTANT_IMAGE_URL } from '@/config/appConfig';
import { openDB, MESSAGES_STORE_NAME, AUTHORIZED_PAYMENTS_STORE_NAME } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


interface StoredMessage {
    id?: number; 
    role: 'user' | 'model';
    content: any;
}


// --- CHAT ITEM COMPONENT ---
interface ChatItemProps {
  chat: Contact;
  onClick: (e: React.MouseEvent) => void;
  userProfile: UserProfile;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onClick, userProfile }) => {
    const isOnline = chat.isOnline;
    
    const isAssistant = userProfile.assistants.some(a => a.chatPath === chat.chatPath);
    const contactProfile = contacts.find(c => c.chatPath === chat.chatPath);
    const isBusiness = contactProfile?.accountType === 'business';

    return (
        <Card className="cursor-pointer glow-card hover:shadow-primary/10 rounded-lg bg-transparent" onClick={onClick}>
            <CardContent className="p-3 flex items-center gap-3">
                <motion.div
                    animate={{ y: [-1, 1, -1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Avatar className="h-12 w-12 border-2 border-primary/30 relative">
                        <AvatarImage src={chat.imageUrl} alt={chat.name} />
                        <AvatarFallback className="text-lg bg-muted">
                            {chat.name ? chat.name.charAt(0) : <User />}
                        </AvatarFallback>
                        {isOnline && (
                           <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                        )}
                    </Avatar>
                </motion.div>
                <div className="flex-grow overflow-hidden">
                <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold truncate text-sm">{chat.name}</p>
                            {isBusiness && (
                                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 !p-0 !w-4 !h-4 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L14.09 8.26L20.36 9.27L15.23 13.91L16.42 20.09L12 16.77L7.58 20.09L8.77 13.91L3.64 9.27L9.91 8.26L12 2Z" fill="#0052FF"/>
                                        <path d="M12 2L9.91 8.26L3.64 9.27L8.77 13.91L7.58 20.09L12 16.77L16.42 20.09L15.23 13.91L20.36 9.27L14.09 8.26L12 2Z" fill="#388BFF"/>
                                        <path d="m10.5 13.5-2-2-1 1 3 3 6-6-1-1-5 5Z" fill="#fff"/>
                                    </svg>
                                </Badge>
                            )}
                            {isAssistant && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">IA</Badge>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 shrink-0">{chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}</p>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || (isOnline ? 'en línea' : 'desconectado')}</p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                            <div className="flex-shrink-0 ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                {chat.unreadCount}
                            </div>
                        )}
                </div>
                </div>
            </CardContent>
        </Card>
    );
};

const MemberSectionButton = ({ icon: Icon, label, notificationCount, onClick }: { icon: React.ElementType, label: string, notificationCount?: number, onClick: () => void }) => {
    return (
        <div className="relative" onClick={onClick}>
            <div className="p-2 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer rounded-lg hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
            </div>
            {(notificationCount || 0) > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-background">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </div>
            )}
        </div>
    )
}

export default function ChatListPage() {
  const { data: session } = useSession();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { contacts, removeContact, clearContactChat } = useContacts();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isAddChatOpen, setIsAddChatOpen] = useState(false);
  const [activeSwipe, setActiveSwipe] = useState<{ chatPath: string; direction: 'left' | 'right' } | null>(null);
  const dragOccurred = useRef(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'delete' | 'clear', contact: Contact } | null>(null);
  
  const [authorizationsCount, setAuthorizationsCount] = useState(0);
  const [creditsCount, setCreditsCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCounts = async () => {
        try {
            const db = await openDB();
            
            // Count pending authorizations (image/video/audio messages)
            const pendingTx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
            const pendingStore = pendingTx.objectStore(MESSAGES_STORE_NAME);
            const allMessages: StoredMessage[] = await pendingStore.getAll();
            const pendingAuthorizations = allMessages.filter(msg => msg.role === 'user' && typeof msg.content === 'object' && ['image', 'video', 'audio', 'document'].includes(msg.content.type));
            setAuthorizationsCount(pendingAuthorizations.length);

            // Count pending credit applications
            if (state.userProfile.creditLines) {
              const pendingCredits = state.userProfile.creditLines.filter(cl => cl.status === 'pending');
              setCreditsCount(pendingCredits.length);
            }

        } catch (error) {
            console.error("Failed to fetch notification counts from IndexedDB:", error);
        }
    };

    // Fetch counts when the component mounts and user is authenticated
    if (state.userProfile.isAuthenticated) {
        fetchNotificationCounts();
    }
  }, [state.userProfile.isAuthenticated, state.userProfile.creditLines]);


  const demoContact: Contact = {
    chatPath: 'demo-chat',
    name: 'Hey Manito! (Demo)',
    imageUrl: DEFAULT_ASSISTANT_IMAGE_URL,
    lastMessage: '¡Bienvenido! Haz clic para ver un ejemplo.',
    isDemo: true,
    conversationSize: 0,
  };

  const chatsToDisplay = useMemo(() => {
    const allContacts = state.userProfile.isAuthenticated ? contacts : [demoContact];
    if (!allContacts) return [demoContact];
    return allContacts.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, contacts, state.userProfile.isAuthenticated, demoContact]);

  const handleAdminNav = (path: string) => {
    router.push(path);
  }

  const handleConfirmDelete = () => {
    if (alertInfo?.type === 'delete' && alertInfo.contact) {
      if (alertInfo.contact.isDemo) {
        toast({ title: "Acción no permitida", description: "No se puede eliminar el chat de demostración." });
      } else {
        removeContact(alertInfo.contact.chatPath);
        toast({ title: "Contacto Eliminado", description: `Se ha eliminado a ${alertInfo.contact.name}.` });
      }
    }
    setAlertInfo(null);
  }
  
  const handleConfirmClear = () => {
     if (alertInfo?.type === 'clear' && alertInfo.contact) {
       if (alertInfo.contact.isDemo) {
        toast({ title: "Acción no permitida", description: "No se puede limpiar el chat de demostración." });
      } else {
        clearContactChat(alertInfo.contact.chatPath);
        toast({ title: "Chat Limpiado", description: `La conversación con ${alertInfo.contact.name} ha sido limpiada.` });
      }
    }
    setAlertInfo(null);
  }
  
  const showPushNotification = async (title: string, options: NotificationOptions) => {
    if (!('Notification' in window)) {
      toast({ title: "Navegador no compatible", description: "Tu navegador no soporta notificaciones push.", variant: "destructive" });
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, options);
      } else {
        toast({ title: "Permiso denegado", description: "No se pueden mostrar notificaciones. Habilítalas en la configuración de tu navegador." });
      }
    } else {
         toast({ title: "Notificaciones bloqueadas", description: "Habilita las notificaciones en la configuración de tu navegador para usar esta función.", variant: "destructive" });
    }
  };

  const showMemoryInfo = (contact: Contact) => {
    showPushNotification(`Info de: ${contact.name}`, {
        body: `El chat ocupa aproximadamente ${formatBytes(contact.conversationSize)}.`,
        icon: '/heymanito.svg' // You can use your app icon
    });
  }

  const botsCount = state.userProfile.assistants?.length || 0;
  const productsCount = state.userProfile.catalogs?.reduce((sum, cat) => sum + cat.products.length, 0) || 0;

  const memberButtons = [
    { icon: CheckSquare, label: "Autorizaciones", view: 'bank', notificationCount: authorizationsCount },
    { icon: Bot, label: "Bots", view: 'bots', notificationCount: botsCount },
    { icon: Package, label: "Productos", view: 'products', notificationCount: productsCount },
    { icon: CreditCard, label: "Créditos", view: 'credit', notificationCount: creditsCount },
  ];

  const handleChatItemClick = (chat: Contact) => {
    dispatch({ type: 'MARK_CHAT_AS_READ', payload: chat.chatPath });
    router.push(`/chat/conversation/${chat.chatPath}`);
  };

  return (
    <>
    <div className="flex flex-col h-full bg-background dark:bg-gray-900 font-display pb-16 md:pb-0">
        <header className="bg-background dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 px-4 pt-4 pb-3">
             <div className="flex items-center justify-between h-10">
                <AnimatePresence initial={false}>
                    {isSearchOpen ? (
                         <motion.div
                            key="search-input"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="flex-grow"
                        >
                            <Input 
                                placeholder="Buscar chats..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10" 
                                autoFocus
                            />
                        </motion.div>
                    ) : (
                        <motion.h1 
                            key="title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                        >
                            Chats
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button className="text-gray-900 dark:text-white p-2" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                    <FaSearch className="text-xl" />
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto" onClick={() => setActiveSwipe(null)}>
            <div className="p-4 bg-muted/50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><FaUserShield className="text-primary"/> Miembro</h3>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                    {memberButtons.map(btn => (
                        <MemberSectionButton
                            key={btn.view}
                            icon={btn.icon}
                            label={btn.label}
                            notificationCount={btn.notificationCount}
                            onClick={() => handleAdminNav(`/chat/admin?view=${btn.view}`)}
                        />
                    ))}
                </div>
                <div className="text-center mt-3">
                        <Button size="sm" variant="link" className="text-xs h-auto p-0 text-muted-foreground" onClick={() => setIsPlansOpen(true)}>
                        Plan actual: Gratuito
                    </Button>
                </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-slate-700">
                 {chatsToDisplay.map((chat) => (
                    <div key={chat.chatPath} className="relative bg-background dark:bg-gray-900 rounded-lg overflow-hidden">
                        <AnimatePresence>
                            {activeSwipe?.chatPath === chat.chatPath && (
                                <motion.div
                                    key="actions"
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="absolute inset-y-0 left-0 flex items-center bg-gray-100 dark:bg-slate-800"
                                >
                                     <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-blue-500/20 hover:bg-blue-500/30 rounded-none" onClick={() => showMemoryInfo(chat)}>
                                        <HardDrive size={20}/>
                                        <span className="text-xs mt-1">Info</span>
                                    </Button>
                                    <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-yellow-500/20 hover:bg-yellow-500/30 rounded-none" onClick={() => setAlertInfo({type: 'clear', contact: chat})}>
                                        <XCircle size={20}/>
                                        <span className="text-xs mt-1">Limpiar</span>
                                    </Button>
                                    <Button variant="ghost" className="h-full w-20 flex flex-col items-center justify-center text-muted-foreground bg-destructive/20 hover:bg-destructive/30 rounded-none" onClick={() => setAlertInfo({type: 'delete', contact: chat})}>
                                        <Trash2 size={20}/>
                                        <span className="text-xs mt-1">Borrar</span>
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                         <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 240 }}
                            onDragStart={(e) => { e.stopPropagation(); dragOccurred.current = false; }}
                            onDrag={(e) => { e.stopPropagation(); dragOccurred.current = true; }}
                            onDragEnd={(event, info) => {
                                const isSwipeRight = info.offset.x > 80;
                                if (isSwipeRight) {
                                    setActiveSwipe({ chatPath: chat.chatPath, direction: 'right' });
                                } else {
                                    setActiveSwipe(null);
                                }
                            }}
                            onClick={(e) => {
                                if (dragOccurred.current || activeSwipe) { e.stopPropagation(); return; }
                                handleChatItemClick(chat);
                            }}
                            animate={{ x: activeSwipe?.chatPath === chat.chatPath ? 240 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="relative z-10 cursor-grab active:cursor-grabbing bg-background dark:bg-gray-900"
                        >
                            <ChatItem chat={chat} onClick={(e) => {
                              e.stopPropagation();
                              handleChatItemClick(chat);
                            }} userProfile={state.userProfile} />
                        </motion.div>
                    </div>
                 ))}
            </div>
        </main>
    </div>
    <PlansDialog isOpen={isPlansOpen} onOpenChange={setIsPlansOpen} />
    <AddChatDialog isOpen={isAddChatOpen} onOpenChange={setIsAddChatOpen} />
    <AlertDialog open={!!alertInfo} onOpenChange={() => setAlertInfo(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                {alertInfo?.type === 'delete' 
                    ? `Se eliminará el contacto "${alertInfo?.contact.name}" y todo su historial de chat. Esta acción no se puede deshacer.`
                    : `Se eliminará todo el historial de chat con "${alertInfo?.contact.name}", pero el contacto permanecerá en tu lista.`
                }
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={alertInfo?.type === 'delete' ? handleConfirmDelete : handleConfirmClear}
                className={alertInfo?.type === 'delete' ? "bg-destructive hover:bg-destructive/90" : ""}
            >
                {alertInfo?.type === 'delete' ? 'Eliminar' : 'Limpiar'}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </>
  );
};
