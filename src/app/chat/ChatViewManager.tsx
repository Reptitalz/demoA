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
  initial: { opacity: 0, x: "100%" },
  animate: { opacity: 1, x: "0%", transition: { duration: 0.2, ease: 'easeInOut' } },
  exit: { opacity: 0, x: "-100%", transition: { duration: 0.2, ease: 'easeInOut' } },
};

// Define un orden para las animaciones de las pestañas principales
const routeOrder = ['/chat/dashboard', '/chat/calls', '/chat/updates', '/chat/profile', '/chat/admin'];

const allViews = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/calls', Component: CallsPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
  // La ruta de conversación se maneja de forma especial
  { path: '/chat/conversation', Component: DesktopChatPage },
];

const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Find the currently active component based on the path
  const ActiveComponent = React.useMemo(() => {
    // Exact match or prefix match for conversation
    const activeView = allViews.find(view => 
      pathname.startsWith(view.path) && 
      (view.path.includes('/conversation') || pathname === view.path)
    );
    return activeView?.Component;
  }, [pathname]);
  
  return (
    <div className="h-full w-full overflow-hidden relative bg-slate-200 dark:bg-slate-900">
       <AnimatePresence mode="wait">
        <motion.div
          key={pathname} // Use pathname as key to trigger animation on route change
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeIn' }}
          className="h-full w-full absolute inset-0"
        >
          <Suspense fallback={
            <PageContainer>
              <div className="h-full w-full flex items-center justify-center">
                <LoadingSpinner />
              </div>
            </PageContainer>
          }>
            {ActiveComponent ? <ActiveComponent /> : children}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ChatViewManager;
