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
import { Suspense } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PageContainer from '@/components/layout/PageContainer';

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: "0%",
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
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

  // Find the currently active component based on the path
  const ActiveComponent = React.useMemo(() => {
    const activeView = allViews.find(view => view.path.test(pathname));
    return activeView?.Component;
  }, [pathname]);

  React.useEffect(() => {
    const prevIndex = routeOrder[previousPathnameRef.current] ?? -1;
    const currentIndex = routeOrder[pathname] ?? -1;

    if (prevIndex !== -1 && currentIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 1 : -1);
    } else if (pathname.startsWith('/chat/conversation/')) {
      setDirection(1);
    } else {
      setDirection(-1);
    }

    previousPathnameRef.current = pathname;
  }, [pathname]);
  
  return (
    <div className="h-full w-full overflow-hidden relative bg-background">
       <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={pathname}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="h-full w-full absolute inset-0"
        >
          <Suspense fallback={
            <PageContainer>
              <div className="h-full w-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
            </PageContainer>
          }>
            {ActiveComponent ? <ActiveComponent /> : fallback}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
