// src/app/chat/ChatViewManager.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Importa los componentes de las páginas directamente
import ChatListPage from './dashboard/page';
import UpdatesPage from './updates/page';
import ChatProfilePage from './profile/page';
import AdminHomePage from './admin/page';
import DesktopChatPage from './conversation/[chatPath]/page';

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? "30%" : "-30%",
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: "0%",
    scale: 1,
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.15
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? "30%" : "-30%",
    scale: 0.95,
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.15
    }
  }),
};

// Define un orden para las animaciones de las pestañas principales
const routeOrder = ['/chat/dashboard', '/chat/updates', '/chat/profile', '/chat/admin'];

const allViews = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
  // La ruta de conversación se maneja de forma especial
  { path: '/chat/conversation', Component: DesktopChatPage },
];

const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Determinar la dirección de la animación para las pestañas principales
  const [prevIndex, setPrevIndex] = React.useState(routeOrder.findIndex(route => pathname.startsWith(route)));
  const currentIndex = routeOrder.findIndex(route => pathname.startsWith(route));
  
  React.useEffect(() => {
      if (currentIndex !== -1) {
          setPrevIndex(currentIndex);
      }
  }, [currentIndex]);
  
  const direction = currentIndex > prevIndex ? 1 : -1;
  
  // Renderiza todas las vistas y controla su visibilidad
  return (
    <div className="h-full w-full overflow-hidden relative bg-slate-200 dark:bg-slate-900">
      {allViews.map(({ path, Component }) => {
        // La conversación es una ruta dinámica, así que comprobamos el prefijo
        const isActive = pathname.startsWith(path);
        
        // La animación de conversación puede ser diferente
        const isConversation = path === '/chat/conversation';
        const conversationVariants = {
            initial: { opacity: 0, x: "100%" },
            animate: { opacity: 1, x: "0%", transition: { duration: 0.2, ease: 'easeInOut' } },
            exit: { opacity: 0, x: "100%", transition: { duration: 0.2, ease: 'easeInOut' } },
        };
        
        const currentVariants = isConversation ? conversationVariants : pageVariants;
        
        // El componente de conversación necesita renderizarse solo si su ruta está activa
        if(isConversation && !isActive) return null;

        return (
            <motion.div
                key={path}
                variants={currentVariants}
                initial="initial"
                animate={isActive ? 'animate' : 'exit'}
                custom={direction}
                className={cn(
                    "absolute inset-0 h-full w-full flex flex-col",
                    !isActive && "pointer-events-none" // Hace que las vistas inactivas no sean interactivas
                )}
            >
                <Component />
            </motion.div>
        )
      })}
    </div>
  );
};

export default ChatViewManager;
