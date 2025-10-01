// src/app/chat/ChatLayout.tsx
"use client";

import React from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import ChatSidebar from '@/components/chat/ChatSidebar'; // Import the new sidebar
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FaComment, FaCamera, FaUser, FaCrown } from 'react-icons/fa';

// This component provides the main structure for the chat dashboard.
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
  
  const [animationClass, setAnimationClass] = React.useState('');
  const previousPathname = React.useRef(pathname);

  React.useEffect(() => {
    if (previousPathname.current !== pathname) {
      const currentIndex = menuItems.findIndex(item => previousPathname.current.startsWith(item.path));
      const newIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
      
      if (currentIndex !== -1 && newIndex !== -1) {
          const direction = newIndex > currentIndex ? 'right' : 'left';
          setAnimationClass(direction === 'right' ? 'animate-page-in-right md:animate-fadeIn' : 'animate-page-in-left md:animate-fadeIn');
      }
      
      previousPathname.current = pathname;
      
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
        setAnimationClass(direction === 'left' ? 'animate-page-out-left md:animate-fadeOut' : 'animate-page-out-right md:animate-fadeOut');
    }
    
    router.push(newPath);

  }, [pathname, router]);

  return (
    <div className="h-[100svh] w-screen flex flex-col md:flex-row bg-transparent overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {isBaseChatView && <ChatSidebar onNavigate={handleRouteChange} />}
      </div>

      <main 
          className={cn(
            "flex-grow overflow-y-auto",
            "pb-16 md:pb-0", // Padding for main nav bar on mobile, none on desktop
            isBaseChatView && animationClass 
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
