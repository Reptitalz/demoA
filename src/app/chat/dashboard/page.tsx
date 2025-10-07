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

    const buttonRects = memberButtons.map(() => ({ x: 0, y: 0, width: 0, height: 0 }));
    let planButtonRect = { x: 0, y: 0, width: 0, height: 0 };
    let toggleButtonRect = { x: 0, y: 0, width: 0, height: 0 };

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
        
        // Main buttons
        const buttonSize = (w - gap * (numButtons + 1)) / numButtons;
        memberButtons.forEach((_, i) => {
            buttonRects[i] = {
                x: gap + i * (buttonSize + gap),
                y: 30, // Position buttons lower to make space for title
                width: buttonSize,
                height: buttonSize,
            };
        });

        // Plan button
        planButtonRect = { x: 16, y: h - 50, width: w - 32, height: 30 };
        
        // Toggle button
        toggleButtonRect = { x: (w / 2) - 20, y: h - 15, width: 40, height: 15 };

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

        if (clickX >= planButtonRect.x && clickX <= planButtonRect.x + planButtonRect.width && clickY >= planButtonRect.y && clickY <= planButtonRect.y + planButtonRect.height) {
            setIsPlansOpen(true);
        }

        if (clickX >= toggleButtonRect.x && clickX <= toggleButtonRect.x + toggleButtonRect.width && clickY >= toggleButtonRect.y && clickY <= toggleButtonRect.y + toggleButtonRect.height) {
            setIsMemberSectionVisible(prev => !prev);
        }
    };
    canvas.addEventListener('click', handleClick);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      
       // Draw Title
      ctx.fillStyle = "hsl(var(--foreground))";
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Miembro', 20, 10);
      
      // Draw main action buttons
      buttonRects.forEach((rect, i) => {
          const button = memberButtons[i];
          const floatY = Math.sin(time / 500 + i) * 2;
          const currentY = rect.y + floatY;
          
          const dx = mouseX - (rect.x + rect.width / 2);
          const dy = mouseY - (currentY + rect.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          ctx.save();
          if (dist < 100) {
            const scale = 1 + (1 - dist / 100) * 0.05;
            ctx.translate(rect.x + rect.width / 2, currentY + rect.height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(rect.x + rect.width / 2), -(currentY + rect.height / 2));
          }

          // Glow effect
          if (dist < 150) {
            const gradient = ctx.createRadialGradient(
              rect.x + rect.width / 2, currentY + rect.height / 2, 0,
              rect.x + rect.width / 2, currentY + rect.height / 2, 100
            );
            const opacity = 1 - (dist / 150);
            gradient.addColorStop(0, `hsla(262, 80%, 58%, ${opacity * 0.15})`);
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(rect.x - 10, currentY - 10, rect.width + 20, rect.height + 20);
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
          const iconSize = rect.height * 0.25;
          ctx.font = `900 ${iconSize}px "Font Awesome 6 Free"`;
          ctx.fillStyle = "hsl(var(--primary))";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const iconMap = { CheckSquare: '\uf14a', Bot: '\uf544', Package: '\uf466', DollarSign: '\uf155' };
          ctx.fillText(iconMap[button.icon.displayName as keyof typeof iconMap] || '?', rect.x + rect.width / 2, currentY + rect.height * 0.4);

          // Draw text
          ctx.fillStyle = "hsl(var(--foreground))";
          ctx.font = `600 ${rect.height * 0.12}px sans-serif`;
          ctx.fillText(button.label, rect.x + rect.width / 2, currentY + rect.height * 0.7);

          // Draw notification badge
          if (button.notificationCount) {
              const badgeRadius = rect.width * 0.1;
              const badgeX = rect.x + rect.width - badgeRadius;
              const badgeY = currentY + badgeRadius;
              ctx.fillStyle = 'hsl(var(--destructive))';
              ctx.beginPath();
              ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = 'white';
              ctx.font = `bold ${badgeRadius}px sans-serif`;
              const text = button.notificationCount > 9 ? '9+' : button.notificationCount.toString();
              ctx.fillText(text, badgeX, badgeY);
          }
          ctx.restore();
      });

      // Draw Plan Button
      ctx.fillStyle = 'hsl(var(--card))';
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(planButtonRect.x, planButtonRect.y, planButtonRect.width, planButtonRect.height, 8);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Plan actual: Gratuito', w / 2, planButtonRect.y + planButtonRect.height / 2);

       // Draw Toggle Button
      ctx.fillStyle = 'hsl(var(--primary) / 0.1)';
      ctx.beginPath();
      ctx.roundRect(toggleButtonRect.x, toggleButtonRect.y, toggleButtonRect.width, toggleButtonRect.height, 8);
      ctx.fill();
      
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '900 12px "Font Awesome 6 Free"';
      ctx.fillText(isMemberSectionVisible ? '\uf077' : '\uf078', w / 2, toggleButtonRect.y + toggleButtonRect.height / 2 + 1);

      animationFrameId = requestAnimationFrame(draw);
    }
    draw(0);

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('click', handleClick);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
  }, [memberButtons, isMemberSectionVisible]); // Re-run effect if memberButtons or visibility change

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
                 <motion.div
                    animate={{ height: isMemberSectionVisible ? 180 : 40 }}
                    initial={{ height: 180 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'pointer' }}/>
                </motion.div>
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
