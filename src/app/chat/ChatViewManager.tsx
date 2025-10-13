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
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/calls', Component: CallsPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
];

const ChatViewManager = () => {
  const pathname = usePathname();
  const [direction, setDirection] = React.useState(0);
  const previousPathnameRef = React.useRef(pathname);

  // Determina la vista activa. Si es una conversación, se maneja por separado.
  const isConversation = pathname.startsWith('/chat/conversation/');
  const activeViewPath = isConversation ? '/chat/conversation' : Object.keys(routeOrder).find(p => pathname.startsWith(p)) || '/chat/dashboard';
  
  React.useEffect(() => {
    const prevPath = previousPathnameRef.current;

    if (prevPath.startsWith('/chat/conversation') && !isConversation) {
      setDirection(-1); // Going back from a conversation to a main view
    } else if (!prevPath.startsWith('/chat/conversation') && isConversation) {
      setDirection(1); // Going from a main view to a conversation
    } else {
      const prevIndex = routeOrder[prevPath] ?? -1;
      const currentIndex = routeOrder[activeViewPath] ?? -1;
      if (prevIndex !== -1 && currentIndex !== -1) {
        setDirection(currentIndex > prevIndex ? 1 : -1);
      }
    }
    
    previousPathnameRef.current = pathname;
  }, [pathname, activeViewPath]);

  return (
    <div className="h-full w-full overflow-hidden relative bg-background">
      {/* Main Tab Views (always rendered, visibility toggled) */}
      <AnimatePresence initial={false} custom={direction}>
        {allViews.map(({ path, Component }) => {
          const isActive = activeViewPath.startsWith(path);
          return (
            <motion.div
              key={path}
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate={isActive ? 'animate' : 'exit'}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: isActive ? 'block' : 'none',
              }}
            >
              <Component />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Conversation View (rendered only when active) */}
      <AnimatePresence initial={false} custom={direction}>
        {isConversation && (
          <motion.div
            key="/chat/conversation"
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="h-full w-full absolute inset-0"
          >
            <DesktopChatPage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
