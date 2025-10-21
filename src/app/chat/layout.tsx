// src/app/chat/layout.tsx
"use client";

import type { ReactNode } from 'react';
import ChatLayout from './ChatLayout';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ChatViewManager from './ChatViewManager';
import { usePathname } from 'next/navigation';
import { SocketProvider } from '@/providers/SocketProvider';

// Este layout envuelve todas las páginas dentro de /chat
export default function ChatDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Si estamos en una página de llamada activa, renderizamos solo el contenido de la llamada
  // sin el ChatLayout (que incluye la barra de navegación).
  if (pathname.startsWith('/chat/call/')) {
    return (
      <SocketProvider>
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen w-screen bg-background">
                <LoadingSpinner size={36} />
            </div>
        }>{children}</Suspense>
      </SocketProvider>
    );
  }

  // Para todas las demás rutas dentro de /chat, usamos el layout principal con la barra de navegación.
  // El ChatViewManager se encargará de renderizar la página correcta, incluida la de conversación.
  return (
    <SocketProvider>
      <ChatLayout>
        <ChatViewManager />
      </ChatLayout>
    </SocketProvider>
  );
}
