// src/app/chat/dashboard/page.tsx
"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp, FaBuilding, FaDollarSign, FaUserTie, FaUserShield } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, Contact } from '@/types';
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

// --- CHAT ITEM COMPONENT ---
interface ChatItemProps {
  chat: Contact;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, onClick }) => {
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors duration-200">
        <div className="relative">
            <Avatar className="h-14 w-14">
                <AvatarImage src={chat.imageUrl} alt={`${chat.name}'s profile picture`} />
                <AvatarFallback>{chat.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-1 overflow-hidden">
            <div className="flex justify-between">
                <p className="text-base font-semibold truncate">{chat.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{chat.lastMessageTimestamp ? new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage || 'No hay mensajes'}</p>
        </div>
    </div>
  );
};

const MemberSectionButton = ({ icon: Icon, label, notificationCount, onClick }: { icon: React.ElementType, label: string, notificationCount?: number, onClick: () => void }) => {
    return (
        <div className="relative" onClick={onClick}>
            <div className="p-2 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer rounded-lg hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
            </div>
            {notificationCount && notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-background">
                    {notificationCount > 9 ? '9+' : notificationCount}
                </div>
            )}
        </div>
    )
}

export default function ChatListPage() {
  const { data: session } = useSession();
  const { state } = useApp();
  const router = useRouter();
  const { toast } = useToast();
  const { contacts, removeContact, clearContactChat } = useContacts();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [activeSwipe, setActiveSwipe] = useState<{ chatPath: string; direction: 'left' | 'right' } | null>(null);
  const dragOccurred = useRef(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'delete' | 'clear', contact: Contact } | null>(null);

  const filteredChats = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, contacts]);

  const handleAdminNav = (path: string) => {
    router.push(path);
  }

  const handleConfirmDelete = () => {
    if (alertInfo?.type === 'delete') {
      removeContact(alertInfo.contact.chatPath);
      toast({ title: "Contacto Eliminado", description: `Se ha eliminado a ${alertInfo.contact.name}.` });
    }
    setAlertInfo(null);
  }
  
  const handleConfirmClear = () => {
     if (alertInfo?.type === 'clear') {
      clearContactChat(alertInfo.contact.chatPath);
      toast({ title: "Chat Limpiado", description: `La conversación con ${alertInfo.contact.name} ha sido limpiada.` });
    }
    setAlertInfo(null);
  }
  
  const showMemoryInfo = (contact: Contact) => {
      // In a real app, you would calculate this more accurately.
      const estimatedSize = contact.lastMessage?.length || 0 * 50; 
      toast({ title: `Info de: ${contact.name}`, description: `El chat ocupa aproximadamente ${formatBytes(estimatedSize)}.` });
  }

  const memberButtons = [
    { icon: CheckSquare, label: "Autorizaciones", view: 'bank', notificationCount: 0 },
    { icon: Bot, label: "Bots", view: 'bots', notificationCount: 0 },
    { icon: Package, label: "Productos", view: 'products', notificationCount: 0 },
    { icon: CreditCard, label: "Créditos", view: 'credit', notificationCount: 0 },
  ];

  return (
    <>
    <div className="flex flex-col h-full bg-background dark:bg-gray-900 font-display pb-16">
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
            <div className="p-4 bg-primary/10 dark:bg-slate-800/50">
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
                 {filteredChats.map((chat) => (
                    <div key={chat.chatPath} className="relative bg-background dark:bg-gray-900 rounded-lg overflow-hidden">
                        <AnimatePresence>
                            {activeSwipe?.chatPath === chat.chatPath && (
                                <motion.div
                                    key="actions"
                                    initial={{ opacity: 0, x: activeSwipe.direction === 'left' ? 50 : -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: activeSwipe.direction === 'left' ? 50 : -50 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="absolute inset-y-0 right-0 flex items-center bg-gray-100 dark:bg-slate-800"
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
                            dragConstraints={{ left: -240, right: 0 }}
                            onDragStart={(e) => { e.stopPropagation(); dragOccurred.current = false; }}
                            onDrag={(e) => { e.stopPropagation(); dragOccurred.current = true; }}
                            onDragEnd={(event, info) => {
                                const isSwipeLeft = info.offset.x < -80;
                                if (isSwipeLeft) {
                                    setActiveSwipe({ chatPath: chat.chatPath, direction: 'left' });
                                } else {
                                    setActiveSwipe(null);
                                }
                            }}
                            onClick={(e) => {
                                if (dragOccurred.current) { e.stopPropagation(); return; }
                                setActiveSwipe(null);
                                router.push(`/chat/conversation/${chat.chatPath}`);
                            }}
                            animate={{ x: activeSwipe?.chatPath === chat.chatPath ? -240 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="relative z-10 cursor-grab active:cursor-grabbing bg-background dark:bg-gray-900"
                        >
                            <ChatItem chat={chat} onClick={() => {}} />
                        </motion.div>
                    </div>
                 ))}
            </div>
        </main>
    </div>
    <PlansDialog isOpen={isPlansOpen} onOpenChange={setIsPlansOpen} />
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
