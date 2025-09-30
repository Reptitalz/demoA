// src/app/chat/ChatLayout.tsx
"use client";

import React from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaCrown, FaArchive, FaRobot, FaDollarSign, FaMoneyBillWave } from 'react-icons/fa';

export type AdminView = 'bank' | 'credit' | 'products' | 'assistants';

// This component provides the main structure for the chat dashboard.
export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isBaseChatView = menuItems.some(item => pathname.startsWith(item.path));
  
  const [animationClass, setAnimationClass] = React.useState('');
  const previousPathname = React.useRef(pathname);


  React.useEffect(() => {
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


  const handleRouteChange = React.useCallback((newPath: string) => {
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
    <div className="h-[100svh] w-screen flex flex-col bg-transparent overflow-x-hidden">
      <main 
          className={cn(
            "flex-grow overflow-y-auto",
             "pb-16", // Padding for main nav bar
            isBaseChatView && animationClass 
          )}
      >
        {children}
      </main>
      
      {isBaseChatView && <ChatNavBar onNavigate={handleRouteChange} />}
    </div>
  );
}

const menuItems = [
    { path: '/chat/dashboard', icon: FaComment, label: 'Chats' },
    { path: '/chat/updates', icon: FaCamera, label: 'Novedades' },
    { path: '/chat/profile', icon: FaUser, label: 'Perfil' },
    { path: '/chat/admin', icon: FaCrown, label: 'Miembro' },
];
