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
    { icon: '\uf14a', label: "Autorizaciones", view: 'bank', notificationCount: 10 },
    { icon: '\uf544', label: "Bots", view: 'bots', notificationCount: 10 },
    { icon: '\uf466', label: "Productos", view: 'products', notificationCount: 10 },
    { icon: '\uf155', label: "Créditos", view: 'credit', notificationCount: 10 },
  ];
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -1000,
      mouseY = -1000;
    const buttonRects = memberButtons.map(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }));

    const computedStyle = getComputedStyle(document.documentElement);
    const getCssVar = (v: string) => computedStyle.getPropertyValue(v).trim();
    const colors = {
      primary: `hsl(${getCssVar("--primary")})`,
      card: `hsl(${getCssVar("--card")})`,
      border: `hsl(${getCssVar("--border")})`,
      foreground: `hsl(${getCssVar("--foreground")})`,
      accent: `hsl(${getCssVar("--accent")})`,
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const padding = 16;
      const buttonSize =
        (w - padding * (memberButtons.length + 1)) / memberButtons.length;

      memberButtons.forEach((_, i) => {
        buttonRects[i] = {
          x: padding + i * (buttonSize + padding),
          y: h / 2 - buttonSize / 2,
          width: buttonSize,
          height: buttonSize,
        };
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener("mousemove", handleMouseMove);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      buttonRects.forEach((r, i) => {
        if (x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height) {
          handleAdminNav(`/chat/admin?view=${memberButtons[i].view}`);
        }
      });
    };
    canvas.addEventListener("click", handleClick);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Fondo degradado sutil con brillo
      const bgGradient = ctx.createLinearGradient(0, 0, w, h);
      bgGradient.addColorStop(0, `hsla(${getCssVar("--primary")}, 0.06)`);
      bgGradient.addColorStop(1, `hsla(${getCssVar("--card")}, 0.9)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, w, h);

      // Título
      ctx.fillStyle = colors.foreground;
      ctx.font = "600 18px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Miembro", 20, 25);

      buttonRects.forEach((r, i) => {
        const icon = memberButtons[i];
        const dx = mouseX - (r.x + r.width / 2);
        const dy = mouseY - (r.y + r.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hover = dist < 60;

        const float = Math.sin(t / 600 + i) * 3;
        const y = r.y + float;

        // Fondo del botón
        const gradient = ctx.createLinearGradient(r.x, y, r.x, y + r.height);
        gradient.addColorStop(
          0,
          hover ? `hsla(${getCssVar("--primary")}, 0.3)` : `hsla(${getCssVar("--primary")}, 0.15)`
        );
        gradient.addColorStop(1, `hsla(${getCssVar("--card")}, 0.95)`);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(r.x, y, r.width, r.height, 16);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = hover ? colors.primary : colors.border;
        ctx.lineWidth = hover ? 2 : 1;
        ctx.stroke();

        // Luz reflejada
        const glossGradient = ctx.createLinearGradient(
          r.x,
          y,
          r.x,
          y + r.height / 2
        );
        glossGradient.addColorStop(0, "rgba(255,255,255,0.2)");
        glossGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glossGradient;
        ctx.fill();

        // Icono
        ctx.fillStyle = hover ? colors.primary : colors.foreground;
        ctx.font = `900 ${r.height * 0.35}px "Font Awesome 6 Free"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon.icon, r.x + r.width / 2, y + r.height * 0.45);

        // Etiqueta
        ctx.font = `500 ${r.height * 0.14}px 'Inter', sans-serif`;
        ctx.fillText(icon.label, r.x + r.width / 2, y + r.height * 0.8);

        // Notificación
        if (icon.notificationCount) {
          ctx.fillStyle = colors.primary;
          ctx.beginPath();
          ctx.arc(r.x + r.width - 10, y + 10, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px 'Inter'";
          ctx.textAlign = "center";
          ctx.fillText(
            icon.notificationCount > 9 ? "9+" : String(icon.notificationCount),
            r.x + r.width - 10,
            y + 10
          );
        }

        ctx.restore();
      });

      // Línea decorativa inferior
      ctx.strokeStyle = `hsla(${getCssVar("--primary")}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - 2);
      ctx.lineTo(w, h - 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };
    draw(0);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [memberButtons]);


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
                    animate={{ height: isMemberSectionVisible ? 180 : 0 }}
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
