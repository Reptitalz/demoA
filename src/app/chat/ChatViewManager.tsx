// src/app/chat/ChatViewManager.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Importa los componentes de las páginas directamente
import ChatListPage from './dashboard/page';
import UpdatesPage from './updates/page';
import ChatProfilePage from './profile/page';
import AdminHomePage from './admin/page';
import DesktopChatPage from './conversation/[chatPath]/page';
import CallsPage from './calls/page';

const allViews = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/calls', Component: CallsPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '/chat/profile', Component: ChatProfilePage },
  { path: '/chat/admin', Component: AdminHomePage },
  { path: '/chat/conversation', Component: DesktopChatPage },
];

const ChatViewManager = () => {
  const pathname = usePathname();

  const ActiveComponent = allViews.find(view => pathname.startsWith(view.path))?.Component;

  return (
    <div className="h-full w-full overflow-hidden relative bg-background">
      {ActiveComponent ? <ActiveComponent /> : <ChatListPage />}
    </div>
  );
};

export default ChatViewManager;
