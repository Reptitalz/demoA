// src/app/chat/dashboard/page.tsx
"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import type { AssistantConfig, Contact } from '@/types';
import { cn, formatBytes } from '@/lib/utils';
import { APP_NAME } from '@/config/appConfig';
import { useRouter } from 'next/navigation';
import { Bot, CheckSquare, Package, DollarSign, Trash2, XCircle, HardDrive } from 'lucide-react';
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


const MemberSectionButton = ({ icon: Icon, label, onClick, notificationCount }: { icon: React.ElementType, label: string, onClick: () => void, notificationCount?: number }) => (
    <div className="relative">
        <button onClick={onClick} className="w-full bg-background dark:bg-slate-800 rounded-xl aspect-square flex flex-col items-center justify-center p-1 shadow hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <Icon className="h-5 w-5 text-primary mb-1"/>
            <span className="text-[10px] text-center text-gray-900 dark:text-gray-200">{label}</span>
        </button>
         {notificationCount && notificationCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background">
                {notificationCount > 9 ? '9+' : notificationCount}
            </div>
        )}
    </div>
);


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
  const [isMemberSectionVisible, setIsMemberSectionVisible] = useState(true);

  const filteredChats = useMemo(() => {
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
    { icon: CheckSquare, label: "Autorizaciones", view: 'bank', notificationCount: 10 },
    { icon: Bot, label: "Bots", view: 'bots', notificationCount: 10 },
    { icon: Package, label: "Productos", view: 'products', notificationCount: 10 },
    { icon: DollarSign, label: "Créditos", view: 'credit', notificationCount: 10 },
  ];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    const buttonRects = memberButtons.map((_, i) => ({
        x: 0, y: 0, width: 0, height: 0,
    }));

    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const w = rect.width;
        const h = rect.height;
        const gap = 16;
        const numButtons = memberButtons.length;
        const buttonSize = (w - gap * (numButtons + 1)) / numButtons;

        memberButtons.forEach((_, i) => {
            buttonRects[i] = {
                x: gap + i * (buttonSize + gap),
                y: (h - buttonSize) / 2,
                width: buttonSize,
                height: buttonSize,
            };
        });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
    canvas.addEventListener('mousemove', handleMouseMove);

    const handleClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        buttonRects.forEach((rect, i) => {
            if (clickX >= rect.x && clickX <= rect.x + rect.width && clickY >= rect.y && clickY <= rect.y + rect.height) {
                handleAdminNav(`/chat/admin?view=${memberButtons[i].view}`);
            }
        });
    };
    canvas.addEventListener('click', handleClick);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
      buttonRects.forEach((rect, i) => {
          const button = memberButtons[i];
          const floatY = Math.sin(time / 500 + i) * 3;
          const currentY = rect.y + floatY;
          
          const dx = mouseX - (rect.x + rect.width / 2);
          const dy = mouseY - (currentY + rect.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Glow effect
          if (dist < 150) {
            const gradient = ctx.createRadialGradient(
              rect.x + rect.width / 2, currentY + rect.height / 2, 0,
              rect.x + rect.width / 2, currentY + rect.height / 2, 100
            );
            const opacity = 1 - (dist / 150);
            gradient.addColorStop(0, `hsla(262, 80%, 58%, ${opacity * 0.2})`);
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(rect.x, currentY, rect.width, rect.height);
          }
          
          // Draw card
          ctx.fillStyle = "hsl(var(--card))";
          ctx.strokeStyle = "hsl(var(--border))";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(rect.x, currentY, rect.width, rect.height, 12);
          ctx.fill();
          ctx.stroke();

          // Draw icon
          const iconSize = rect.height * 0.3;
          ctx.fillStyle = "hsl(var(--primary))";
          ctx.font = `bold ${iconSize}px "Font Awesome 5 Free"`; // Using Font Awesome
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let iconChar = '?';
          if (button.icon === CheckSquare) iconChar = '\uf14a';
          if (button.icon === Bot) iconChar = '\uf544';
          if (button.icon === Package) iconChar = '\uf466';
          if (button.icon === DollarSign) iconChar = '\uf155';
          ctx.fillText(iconChar, rect.x + rect.width / 2, currentY + rect.height * 0.4);

          // Draw text
          ctx.fillStyle = "hsl(var(--foreground))";
          ctx.font = `bold ${rect.height * 0.1}px sans-serif`;
          ctx.fillText(button.label, rect.x + rect.width / 2, currentY + rect.height * 0.75);

          // Draw notification badge
          if (button.notificationCount) {
              const badgeRadius = rect.width * 0.12;
              const badgeX = rect.x + rect.width - badgeRadius / 2;
              const badgeY = currentY + badgeRadius / 2;
              ctx.fillStyle = 'hsl(var(--destructive))';
              ctx.beginPath();
              ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = 'white';
              ctx.font = `bold ${badgeRadius * 1.1}px sans-serif`;
              const text = button.notificationCount > 9 ? '9+' : button.notificationCount.toString();
              ctx.fillText(text, badgeX, badgeY + 1); // Adjust for better vertical alignment
          }
      });
      animationFrameId = requestAnimationFrame(draw);
    }
    draw(0);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('click', handleClick);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
  }, [memberButtons]); // Re-run effect if memberButtons change

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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>workspace_premium</span>
                        <h2 className="font-bold text-gray-900 dark:text-white">Miembro</h2>
                    </div>
                </div>
                 <motion.div
                    animate={{ height: isMemberSectionVisible ? 'auto' : 0 }}
                    initial={{ height: 'auto' }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100px', cursor: 'pointer' }}/>
                     <div onClick={() => setIsPlansOpen(true)} className="mt-4 bg-background dark:bg-slate-800 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <p className="text-sm text-gray-900 dark:text-gray-200">Plan actual: <span className="font-bold">Gratuito</span></p>
                    </div>
                </motion.div>
                <div className="flex justify-center -mb-4">
                  <Button variant="ghost" size="icon" className="h-6 w-10 bg-primary/10 dark:bg-slate-800/50 rounded-b-lg hover:bg-primary/20" onClick={() => setIsMemberSectionVisible(!isMemberSectionVisible)}>
                        {isMemberSectionVisible ? <FaChevronUp className="h-3 w-3" /> : <FaChevronDown className="h-3 w-3" />}
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
                                router.push(`/chat/${chat.chatPath}`);
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
