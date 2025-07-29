
"use client"; 
import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/app/footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = pathname === '/'; 
  const layoutShouldBeFullWidth = isMarketingPage;
  
  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      <Header fullWidth={layoutShouldBeFullWidth} />
      <div className={cn("flex-grow w-full")}>
        {children}
      </div>
      <Footer fullWidth={layoutShouldBeFullWidth} />
      <Toaster />
    </div>
  );
};

export default AppLayout;
