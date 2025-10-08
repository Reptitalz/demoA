// src/app/chat/ChatViewManager.tsx
"use client";

import React, { Children } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ChatListPage from './dashboard/page';
import UpdatesPage from './updates/page';
import ChatProfilePage from './profile/page';
import AdminHomePage from './admin/page';

const routes = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

const ChatViewManager = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isBaseChatView = routes.some(route => pathname.startsWith(route.path));
  
  // If we are on a specific chat view (e.g., /chat/conversation/my-assistant),
  // we just render the children directly without the view manager logic.
  if (!isBaseChatView) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
        <div key={pathname} className="h-full w-full">
            {routes.map(({ path, Component }) =>
                pathname.startsWith(path) ? <Component key={path} /> : null
            )}
        </div>
    </AnimatePresence>
  );
};

export default ChatViewManager;
