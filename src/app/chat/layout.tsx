
// src/app/chat/layout.tsx
import type { ReactNode } from 'react';
import ChatLayout from './ChatLayout';

// Este layout envuelve todas las páginas dentro de /chat
export default function ChatDashboardLayout({ children }: { children: ReactNode }) {
  return <ChatLayout>{children}</ChatLayout>;
}
