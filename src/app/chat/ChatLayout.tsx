// src/app/chat/ChatLayout.tsx
"use client";

import type { ReactNode } from 'react';
import ChatNavBar from './ChatNavBar';
import { usePathname } from 'next/navigation';

// This component provides the main structure for the chat dashboard.
export default function ChatLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // The individual chat view should not have the nav bar.
  // We check if the path is exactly '/chat' or one of its direct children.
  const showNavBar = /^\/chat(\/(updates|profile))?$/.test(pathname);

  return (
    <div className="h-screen w-screen flex flex-col bg-muted/40">
      <main className="flex-grow overflow-hidden">
        {children}
      </main>
      
      {showNavBar && <ChatNavBar />}
    </div>
  );
}
