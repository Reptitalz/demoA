
"use client";

import type { ReactNode } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { usePathname } from 'next/navigation';

export default function RootLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCallPage = pathname.startsWith('/chat/call/');
  
  if (isCallPage) {
    return <>{children}</>;
  }
  
  return <AppLayout>{children}</AppLayout>;
}
