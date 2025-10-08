// src/app/chat/layout.tsx
"use client";

import type { ReactNode } from 'react';
import ChatLayout from './ChatLayout';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChatViewManager from './ChatViewManager';
import { usePathname } from 'next/navigation';

// Este layout envuelve todas las páginas dentro de /chat
export default function ChatDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // If we are on a call page, don't use the ChatLayout, just render the children directly
  if (pathname.startsWith('/chat/call/')) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={
      <div className="h-full w-screen flex items-center justify-center bg-transparent">
        <LoadingSpinner size={36} />
      </div>
    }>
      <ChatLayout>
        <ChatViewManager>
          {children}
        </ChatViewManager>
      </ChatLayout>
    </Suspense>
  );
}
