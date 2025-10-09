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

const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? "100%" : "-100%",
  }),
  animate: {
    opacity: 1,
    x: "0%",
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.4
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? "100%" : "-100%",
    transition: {
      type: "tween",
      ease: "anticipate",
      duration: 0.4
    }
  }),
};

const routeOrder = ['/chat/dashboard', '/chat/updates', '/chat/profile', '/chat/admin'];

const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Find the index of the current route to determine animation direction
  const currentIndex = routeOrder.findIndex(route => pathname.startsWith(route));
  
  const [prevIndex, setPrevIndex] = React.useState(currentIndex);
  const direction = currentIndex > prevIndex ? 1 : -1;
  
  React.useEffect(() => {
    const newIndex = routeOrder.findIndex(route => pathname.startsWith(route));
    if (newIndex !== -1) {
        setPrevIndex(newIndex);
    }
  }, [pathname]);
  
  const isManagedRoute = routeOrder.some(route => pathname.startsWith(route));

  // Render the specific component based on the path
  let CurrentPageComponent: React.ReactNode;
  if (pathname.startsWith('/chat/dashboard')) {
      CurrentPageComponent = <ChatListPage />;
  } else if (pathname.startsWith('/chat/updates')) {
      CurrentPageComponent = <UpdatesPage />;
  } else if (pathname.startsWith('/chat/profile')) {
      CurrentPageComponent = <ChatProfilePage />;
  } else if (pathname.startsWith('/chat/admin')) {
      CurrentPageComponent = <AdminHomePage />;
  } else {
      // For non-managed routes like conversations, just render the children
      return <>{children}</>;
  }

  return (
    <div className="h-full w-full overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
            key={pathname.split('/')[2]} // Use the main view segment as key
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0"
        >
          {CurrentPageComponent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
