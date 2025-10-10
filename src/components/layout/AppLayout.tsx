
"use client"; 
import type { ReactNode } from 'react';
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from '@/components/ui/toast';
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import DynamicCanvasBackground from './DynamicCanvasBackground';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = ['/', '/begin', '/terms', '/privacy', '/colaboradores', '/make', '/try', '/access', '/whatsapp'].includes(pathname);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className={cn("min-h-screen flex flex-col text-foreground bg-background")}>
      {isClient && isMarketingPage && <DynamicCanvasBackground />}
      <div className="relative z-10 flex flex-col min-h-screen">
        {isMarketingPage && <Header fullWidth />}
        <div className={cn("flex-grow w-full")}>
          {children}
        </div>
        {isMarketingPage && <Footer fullWidth />}
      </div>
      {isClient && (
        <ToastProvider>
          <Toaster />
        </ToastProvider>
      )}
    </div>
  );
};

export default AppLayout;
