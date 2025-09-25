// src/app/chat/layout.tsx
import type { ReactNode } from 'react';
import ChatLayout from './ChatLayout';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';


// Este layout envuelve todas las páginas dentro de /chat
export default function ChatDashboardLayout({ children }: { children: ReactNode }) {
  return (
      <Suspense fallback={
            <PageContainer className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size={36} />
            </PageContainer>
      }>
        <ChatLayout>{children}</ChatLayout>
    </Suspense>
  );
}
