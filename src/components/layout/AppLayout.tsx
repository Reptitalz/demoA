
"use client"; 
import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/app/footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import BottomNavigationBar from '@/components/layout/BottomNavigationBar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = pathname === '/'; 
  const isAppArea = pathname.startsWith('/dashboard') || pathname.startsWith('/app');
  const layoutShouldBeFullWidth = isMarketingPage;
  
  // Conditionally render BottomNavigationBar
  const showBottomNav = isAppArea && !(pathname === '/app' && !pathname.includes('consumption'));

  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      <Header fullWidth={layoutShouldBeFullWidth} />
      <div className={cn("flex-grow w-full", showBottomNav && "pb-16 md:pb-0")}>
        {children}
      </div>
      {showBottomNav && <BottomNavigationBar />}
      <Footer fullWidth={layoutShouldBeFullWidth} />
      <Toaster />
    </div>
  );
};

export default AppLayout;
