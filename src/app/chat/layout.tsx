// src/app/chat/layout.tsx
"use client";

import type { ReactNode } from 'react';
import ChatLayout from './ChatLayout';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChatViewManager from './ChatViewManager';

// Este layout envuelve todas las páginas dentro de /chat
export default function ChatDashboardLayout({ children }: { children: ReactNode }) {
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
