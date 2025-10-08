// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaPhoneAlt } from 'react-icons/fa';
import AddChatDialog from '@/components/chat/AddChatDialog'; // Import the dialog

const menuItems = [
    { path: '/chat/dashboard', icon: FaComment, label: 'Chats' },
    { path: '/chat/updates', icon: FaCamera, label: 'Novedades' },
    { path: '/chat/calls', icon: FaPhoneAlt, label: 'Llamadas' },
    { path: '/chat/profile', icon: FaUser, label: 'Perfil' },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);

  // This logic now determines which views get the bottom navbar.
  // We want it on all base views, including the list of calls.
  const showNavBar = menuItems.some(item => pathname.startsWith(item.path)) || pathname === '/chat/admin';

  const handleRouteChange = React.useCallback((newPath: string) => {
    if (pathname === newPath) return;
    router.push(newPath, { scroll: false });
  }, [pathname, router]);

  return (
    <>
      <div className="h-[100svh] w-screen flex flex-col md:flex-row bg-transparent overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          {showNavBar && <ChatSidebar onNavigate={handleRouteChange} />}
        </div>

        <main 
            className={cn(
              "flex-grow relative",
              // Add padding-bottom only if the nav bar is visible on mobile
              showNavBar && "pb-16 md:pb-0"
            )}
        >
          {children}
        </main>
        
        {/* Mobile Bottom NavBar */}
        <div className="md:hidden">
          {showNavBar && <ChatNavBar onNavigate={handleRouteChange} onAddChat={() => setIsAddChatDialogOpen(true)} />}
        </div>
      </div>
      <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
    </>
  );
}
