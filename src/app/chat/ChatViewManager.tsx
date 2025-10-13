// src/app/chat/ChatViewManager.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Importa los componentes de las páginas directamente
import ChatListPage from './dashboard/page';
import UpdatesPage from './updates/page';
import ChatProfilePage from './profile/page';
import AdminHomePage from './admin/page';
import DesktopChatPage from './conversation/[chatPath]/page';
import CallsPage from './calls/page';

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: 'tween', ease: 'anticipate', duration: 0.4 }
  }),
  animate: {
    x: "0%",
    opacity: 1,
    transition: { type: 'spring', stiffness: 280, damping: 25 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: 'tween', ease: 'anticipate', duration: 0.4 }
  }),
};

// Define un orden para las animaciones de las pestañas principales
const routeOrder: { [key: string]: number } = {
  '/chat/dashboard': 0,
  '/chat/calls': 1,
  '/chat/updates': 2,
  '/chat/profile': 3,
  '/chat/admin': 4,
};

const allViews = [
  { path: /^\/chat\/dashboard$/, Component: ChatListPage },
  { path: /^\/chat\/calls$/, Component: CallsPage },
  { path: /^\/chat\/updates$/, Component: UpdatesPage },
  { path: /^\/chat\/profile$/, Component: ChatProfilePage },
  { path: /^\/chat\/admin$/, Component: AdminHomePage },
  // La ruta de conversación se maneja de forma especial
  { path: /^\/chat\/conversation\/[^/]+$/, Component: DesktopChatPage },
];

const ChatViewManager = ({ fallback }: { fallback: React.ReactNode }) => {
  const pathname = usePathname();
  const [direction, setDirection] = React.useState(0);
  const previousPathnameRef = React.useRef(pathname);

  // Determina el componente activo actual
  const ActiveComponent = React.useMemo(() => {
    const activeView = allViews.find(view => view.path.test(pathname));
    return activeView?.Component;
  }, [pathname]);

  React.useEffect(() => {
    const prevPath = previousPathnameRef.current;
    const isPrevConversation = prevPath.startsWith('/chat/conversation/');
    const isCurrentConversation = pathname.startsWith('/chat/conversation/');
    
    // Si vamos de una conversación a la lista, la dirección es -1 (hacia atrás)
    if(isPrevConversation && !isCurrentConversation) {
        setDirection(-1);
    } 
    // Si vamos de la lista a una conversación, la dirección es 1 (hacia adelante)
    else if (!isPrevConversation && isCurrentConversation) {
        setDirection(1);
    }
    // Lógica de pestañas
    else {
        const prevIndex = routeOrder[prevPath] ?? -1;
        const currentIndex = routeOrder[pathname] ?? -1;

        if (prevIndex !== -1 && currentIndex !== -1) {
            setDirection(currentIndex > prevIndex ? 1 : -1);
        }
    }
    
    previousPathnameRef.current = pathname;
  }, [pathname]);
  
  return (
    <div className="h-full w-full overflow-hidden relative bg-background">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={pathname} // La clave es el pathname para que AnimatePresence detecte el cambio
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full w-full absolute inset-0"
        >
          {ActiveComponent ? <ActiveComponent /> : fallback}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
