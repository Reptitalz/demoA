// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaPlus, FaPhoneAlt, FaShoppingBag } from 'react-icons/fa';
import AddChatDialog from '@/components/chat/AddChatDialog'; // Import the dialog
import { Button } from '@/components/ui/button';
import MarketplaceDialog from '@/components/chat/MarketplaceDialog'; // Import the new marketplace dialog

const menuItems = [
    { path: '/chat/dashboard', icon: FaComment, label: 'Chats' },
    { path: '/chat/calls', icon: FaPhoneAlt, label: 'Llamadas' },
    { path: '/chat/updates', icon: FaCamera, label: 'Novedades' },
    { path: '/chat/profile', icon: FaUser, label: 'Perfil' },
];

export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAddChatDialogOpen, setIsAddChatDialogOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false); // State for the marketplace dialog
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const showNavBar = menuItems.some(item => pathname.startsWith(item.path)) || pathname === '/chat/admin';

  const handleRouteChange = useCallback((newPath: string) => {
    if (pathname === newPath) return;
    router.push(newPath); // Use the standard router push
  }, [pathname, router]);

  return (
    <>
      <div 
        className="h-[100svh] w-screen flex flex-col md:flex-row bg-transparent overflow-hidden"
      >
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
      
       {/* Floating Action Buttons */}
      {isClient && showNavBar && (
          <>
            {/* Marketplace FAB */}
            <Button
                size="icon"
                className="fixed bottom-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full shadow-lg bg-primary text-primary-foreground z-20 transition-transform transform hover:scale-105"
                onClick={() => setIsMarketplaceOpen(true)}
                aria-label="Abrir mercado"
            >
                <FaShoppingBag className="h-7 w-7" />
            </Button>

            {/* Add Chat FAB */}
            <Button
                size="icon"
                className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-green-gradient text-primary-foreground md:hidden z-20"
                onClick={() => setIsAddChatDialogOpen(true)}
                aria-label="Añadir nuevo chat"
            >
                <FaPlus className="h-6 w-6" />
            </Button>
          </>
      )}

      <AddChatDialog isOpen={isAddChatDialogOpen} onOpenChange={setIsAddChatDialogOpen} />
      <MarketplaceDialog isOpen={isMarketplaceOpen} onOpenChange={setIsMarketplaceOpen} />
    </>
  );
}
