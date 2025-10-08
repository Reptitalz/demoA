// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
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

  const handleRouteChange = useCallback((newPath: string) => {
    if (pathname === newPath) return;
    router.push(newPath); // Use the standard router push
  }, [pathname, router]);

  // Swipe navigation logic mejorada
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const touchStartTime = useRef(0);
  const swipeHandled = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    swipeHandled.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (swipeHandled.current) return;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    // 🔹 Umbrales de sensibilidad
    const minSwipeDistance = 80; // mínimo desplazamiento en X
    const maxSwipeOffAngle = 60; // máximo desplazamiento vertical permitido
    const maxTapDistance = 15; // si es menos que esto, se considera toque normal
    const minSwipeSpeed = 100; // velocidad mínima (px/s)

    // 🔹 Ignorar taps
    if (Math.abs(deltaX) < maxTapDistance && Math.abs(deltaY) < maxTapDistance) {
      return; // Toque normal → deja pasar eventos de click
    }

    // 🔹 Evitar falsos positivos verticales
    if (Math.abs(deltaY) > maxSwipeOffAngle) return;

    // 🔹 Calcular velocidad del swipe
    const speed = Math.abs(deltaX) / deltaTime * 1000; // px/s

    // 🔹 Validar swipe real
    if (Math.abs(deltaX) > minSwipeDistance && speed > minSwipeSpeed) {
      const currentIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
      if (currentIndex === -1) return;
      swipeHandled.current = true;

      if (deltaX < 0) {
        const nextIndex = Math.min(currentIndex + 1, menuItems.length - 1);
        if (nextIndex !== currentIndex) handleRouteChange(menuItems[nextIndex].path);
      } else {
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) handleRouteChange(menuItems[prevIndex].path);
      }
    }
  };


  return (
    <>
      <div 
        className="h-[100svh] w-screen flex flex-col md:flex-row bg-transparent overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
