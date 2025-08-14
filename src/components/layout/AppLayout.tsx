"use client"; 
import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/app/footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import DynamicCanvasBackground from './DynamicCanvasBackground';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = pathname === '/'; 
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isLoginPage = pathname === '/login';
  
  const layoutShouldBeFullWidth = isMarketingPage;
  const showCanvas = isMarketingPage || isLoginPage;
  
  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      {showCanvas && <DynamicCanvasBackground />}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isDashboardPage && <Header fullWidth={layoutShouldBeFullWidth} />}
        <div className={cn("flex-grow w-full")}>
          {children}
        </div>
        {!isDashboardPage && <Footer fullWidth={layoutShouldBeFullWidth} />}
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;
