"use client"; 
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import BottomNavigationBar from './BottomNavigationBar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = pathname === '/'; 
  const isDashboardPage = pathname.startsWith('/dashboard');
  const layoutShouldBeFullWidth = isMarketingPage;

  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      <Header fullWidth={layoutShouldBeFullWidth} />
      <div className={cn("flex-grow w-full", isDashboardPage && "pb-16 md:pb-0")}>
        {children}
      </div>
      {isDashboardPage && <BottomNavigationBar />}
      <Footer fullWidth={layoutShouldBeFullWidth} />
      <Toaster />
    </div>
  );
};

export default AppLayout;
