// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageSquare, Camera, User, Settings } from 'lucide-react';

const menuItems = [
    { path: '/chat/dashboard', icon: MessageSquare, label: 'Chats' },
    { path: '/chat/updates', icon: Camera, label: 'Novedades' },
    { path: '/chat/profile', icon: User, label: 'Perfil' },
    { path: '/chat/admin', icon: Settings, label: 'Admin' },
];

// This component provides the main structure for the chat dashboard.
export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isBaseChatView = menuItems.some(item => pathname.startsWith(item.path));
  
  const [animationClass, setAnimationClass] = useState('');
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      const currentIndex = menuItems.findIndex(item => previousPathname.current.startsWith(item.path));
      const newIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
      
      if (currentIndex !== -1 && newIndex !== -1) {
          const direction = newIndex > currentIndex ? 'right' : 'left';
          setAnimationClass(direction === 'right' ? 'animate-page-in-right' : 'animate-page-in-left');
      }
      
      previousPathname.current = pathname;
      
      // Clean up animation class after it has finished
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);


  const handleRouteChange = useCallback((newPath: string) => {
    if (pathname === newPath) return;

    const currentIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
    const newIndex = menuItems.findIndex(item => newPath.startsWith(item.path));
    
    if (currentIndex !== -1 && newIndex !== -1) {
        const direction = newIndex > currentIndex ? 'left' : 'right';
        setAnimationClass(direction === 'left' ? 'animate-page-out-left' : 'animate-page-out-right');
    }
    
    // Navigate immediately, animation will play on the outgoing component
    router.push(newPath);

  }, [pathname, router]);
  
  return (
    <div className="h-screen w-screen flex flex-col bg-transparent overflow-x-hidden">
      <main 
          className={cn(
            "flex-grow overflow-hidden",
            isBaseChatView && animationClass // Apply animation
          )}
      >
        {children}
      </main>
      
      {isBaseChatView && <ChatNavBar onNavigate={handleRouteChange} />}
    </div>
  );
}
