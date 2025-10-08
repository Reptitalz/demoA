// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaPlus } from 'react-icons/fa';
import AddChatDialog from '@/components/chat/AddChatDialog'; // Import the dialog
import { Button } from '@/components/ui/button';

const menuItems = [
    { path: '/chat/dashboard', icon: FaComment, label: 'Chats' },
    { path: '/chat/updates', icon: FaCamera, label: 'Novedades' },
    { path: '/chat/profile', icon: FaUser, label: 'Perfil' },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);

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
      
       {/* Floating Action Button */}
      {showNavBar && (
          <Button
            size="icon"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-brand-gradient text-primary-foreground md:hidden"
            onClick={() => setIsAddChatDialogOpen(true)}
            aria-label="Añadir nuevo chat"
          >
              <FaPlus className="h-6 w-6" />
          </Button>
      )}

      <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
    </>
  );
}
