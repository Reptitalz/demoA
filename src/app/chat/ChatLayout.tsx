// src/app/chat/ChatLayout.tsx
"use client";

import React, from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageSquare, Camera, User, Settings, BarChart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
    { path: '/chat/dashboard', icon: MessageSquare, label: 'Chats' },
    { path: '/chat/updates', icon: Camera, label: 'Novedades' },
    { path: '/chat/profile', icon: User, label: 'Perfil' },
    { path: '/chat/admin', icon: Settings, label: 'Admin' },
];

const AdminNavBar = () => (
    <nav className="fixed bottom-16 left-0 right-0 h-10 bg-card/90 backdrop-blur-sm border-t z-20 shrink-0 animate-fadeIn">
        <div className="flex justify-around items-center h-full max-w-md mx-auto">
            <Button variant="ghost" className="h-full text-primary px-6">
                <Eye className="h-5 w-5"/>
            </Button>
            <Button variant="ghost" className="h-full text-muted-foreground px-6">
                <BarChart className="h-5 w-5"/>
            </Button>
        </div>
    </nav>
);

// This component provides the main structure for the chat dashboard.
export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isBaseChatView = menuItems.some(item => pathname.startsWith(item.path));
  const isAdminView = pathname.startsWith('/chat/admin');
  
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
    <div className="h-screen w-screen flex flex-col bg-transparent overflow-x-hidden">
      <main 
          className={cn(
            "flex-grow overflow-y-auto",
             isBaseChatView && "pb-16", // Padding for main nav bar
             isAdminView && "pb-10", // Extra padding for admin nav bar
            isBaseChatView && animationClass 
          )}
      >
        {children}
      </main>
      
      {isAdminView && <AdminNavBar />}
      {isBaseChatView && <ChatNavBar onNavigate={handleRouteChange} />}
    </div>
  );
}
