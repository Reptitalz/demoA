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

const routeOrder = ['/chat/dashboard', '/chat/updates', '/chat/profile', '/chat/admin'];

const allViews = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
];

const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Determine animation direction
  const [prevIndex, setPrevIndex] = React.useState(routeOrder.findIndex(route => pathname.startsWith(route)));
  const currentIndex = routeOrder.findIndex(route => pathname.startsWith(route));
  
  React.useEffect(() => {
      if (currentIndex !== -1) {
          setPrevIndex(currentIndex);
      }
  }, [currentIndex]);
  
  const direction = currentIndex > prevIndex ? 1 : -1;
  
  const isManagedRoute = routeOrder.some(route => pathname.startsWith(route));

  // If the route is not one of the main tabs (e.g., a conversation), just render it directly.
  if (!isManagedRoute) {
    return <>{children}</>;
  }

  return (
    <div className="h-full w-full overflow-hidden relative">
      {allViews.map(({ path, Component }) => {
        const isActive = pathname.startsWith(path);
        return (
            <motion.div
                key={path}
                initial="initial"
                animate={isActive ? 'animate' : 'exit'}
                variants={pageVariants}
                custom={direction}
                className={cn(
                    "absolute inset-0",
                    !isActive && "pointer-events-none" // Make inactive views non-interactive
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
