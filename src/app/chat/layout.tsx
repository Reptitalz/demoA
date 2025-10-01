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
    <ChatLayout>
      <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size={36} />
            </PageContainer>
      }>
        <ChatViewManager>
          {children}
        </ChatViewManager>
      </Suspense>
    </ChatLayout>
  );
}
