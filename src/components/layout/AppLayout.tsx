
"use client"; 
import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/app/footer';
import TopBar from '@/components/layout/TopBar'; // Importar TopBar
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import DynamicCanvasBackground from './DynamicCanvasBackground';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = ['/', '/begin', '/terms', '/privacy', '/colaboradores'].includes(pathname);
  const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/app');
  const isDashboardDemoPage = pathname.startsWith('/dashboarddemo');
  const isCollaboratorDemoPage = pathname.startsWith('/democolaborator');
  const isLoginPage = pathname.startsWith('/login') || pathname.startsWith('/colaboradores/login');
  const isChatPage = pathname.startsWith('/chat');
  
  const layoutShouldBeFullWidth = pathname === '/';
  const showCanvas = isMarketingPage || isLoginPage || isChatPage;
  const showHeaderAndFooter = !isDashboardPage && !isDashboardDemoPage && !isCollaboratorDemoPage && !isLoginPage && !isChatPage;
  
  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      {showCanvas && <DynamicCanvasBackground />}
      <div className="relative z-10 flex flex-col min-h-screen">
        {showHeaderAndFooter && <TopBar fullWidth={layoutShouldBeFullWidth} />}
        {showHeaderAndFooter && <Header fullWidth={layoutShouldBeFullWidth} />}
        <div className={cn("flex-grow w-full")}>
          {children}
        </div>
        {showHeaderAndFooter && <Footer fullWidth={layoutShouldBeFullWidth} />}
      </div>
      <Toaster />
    </div>
  );
};

export default AppLayout;
