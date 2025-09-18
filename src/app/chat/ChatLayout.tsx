// src/app/chat/ChatLayout.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageSquare, Camera, User } from 'lucide-react';

const menuItems = [
    { path: '/chat', icon: MessageSquare, label: 'Chats' },
    { path: '/chat/updates', icon: Camera, label: 'Novedades' },
    { path: '/chat/profile', icon: User, label: 'Perfil' },
];

// This component provides the main structure for the chat dashboard.
export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // The individual chat view ([chatPath]) should not have the swipe/nav bar logic.
  const isBaseChatView = menuItems.some(item => item.path === pathname);

  // State for swipe navigation
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const touchEndY = React.useRef(0);
  const swipeHandled = React.useRef(false);

  // State for page transition animation
  const [animationClass, setAnimationClass] = React.useState('animate-page-in-right');

  const handleRouteChange = useCallback((newPath: string) => {
      if (pathname === newPath) return;

      const currentIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
      const newIndex = menuItems.findIndex(item => newPath.startsWith(item.path));
      
      if (currentIndex === -1 || newIndex === -1) {
          router.push(newPath);
          return;
      }

      const direction = newIndex > currentIndex ? 'left' : 'right';
      setAnimationClass(direction === 'left' ? 'animate-page-out-left' : 'animate-page-out-right');

      // Allow the "out" animation to start before navigating
      setTimeout(() => {
          router.push(newPath);
      }, 50); 
  }, [pathname, router]);
  
  React.useEffect(() => {
      // Apply the "in" animation whenever the pathname changes.
      const lastDirection = animationClass.includes('left') ? 'left' : 'right';
      const inClass = lastDirection === 'left' ? 'animate-page-in-right' : 'animate-page-in-left';
      setAnimationClass(inClass);

      // Clean up animation class after it has finished
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
  }, [pathname]);


  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.targetTouches[0].clientX;
      touchStartY.current = e.targetTouches[0].clientY;
      swipeHandled.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      touchEndX.current = e.targetTouches[0].clientX;
      touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
      if (swipeHandled.current) return;

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;

      // Ensure it's a horizontal swipe and not a vertical scroll
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 75) {
          const currentIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
          if (currentIndex === -1) return;

          if (deltaX < -75) { // Swiped left
              const nextIndex = (currentIndex + 1) % menuItems.length;
              handleRouteChange(menuItems[nextIndex].path);
          } else if (deltaX > 75) { // Swiped right
              const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
              handleRouteChange(menuItems[prevIndex].path);
          }
          swipeHandled.current = true;
      }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-muted/40">
      <main 
          className={cn(
            "flex-grow overflow-hidden",
            isBaseChatView && animationClass // Only apply animation to base views
          )}
          onTouchStart={isBaseChatView ? handleTouchStart : undefined}
          onTouchMove={isBaseChatView ? handleTouchMove : undefined}
          onTouchEnd={isBaseChatView ? handleTouchEnd : undefined}
      >
        {children}
      </main>
      
      {isBaseChatView && <ChatNavBar onNavigate={handleRouteChange} />}
    </div>
  );
}
