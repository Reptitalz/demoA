// src/app/chat/ChatLayout.tsx
"use client";

import React from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaCrown } from 'react-icons/fa';

const menuItems = [
    { path: '/chat/dashboard', icon: FaComment, label: 'Chats' },
    { path: '/chat/updates', icon: FaCamera, label: 'Novedades' },
    { path: '/chat/profile', icon: FaUser, label: 'Perfil' },
    { path: '/chat/admin', icon: FaCrown, label: 'Miembro' },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isBaseChatView = menuItems.some(item => pathname.startsWith(item.path));

  const handleRouteChange = React.useCallback((newPath: string) => {
    if (pathname === newPath) return;
    router.push(newPath, { scroll: false });
  }, [pathname, router]);

  return (
    <div className="h-[100svh] w-screen flex flex-col md:flex-row bg-transparent overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {isBaseChatView && <ChatSidebar onNavigate={handleRouteChange} />}
      </div>

      <main 
          className={cn(
            "flex-grow relative",
            "pb-16 md:pb-0" // Padding for main nav bar on mobile, none on desktop
          )}
      >
        {children}
      </main>
      
      {/* Mobile Bottom NavBar */}
      <div className="md:hidden">
        {isBaseChatView && <ChatNavBar onNavigate={handleRouteChange} />}
      </div>
    </div>
  );
}
