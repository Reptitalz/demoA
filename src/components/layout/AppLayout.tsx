
"use client"; 
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; 
import { cn } from '@/lib/utils';
import DynamicCanvasBackground from './DynamicCanvasBackground'; // Import the new component

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const isMarketingPage = pathname === '/'; 
  const layoutShouldBeFullWidth = isMarketingPage;

  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      <DynamicCanvasBackground /> {/* Add the canvas background here */}
      <Header fullWidth={layoutShouldBeFullWidth} />
      {children}
      <Footer fullWidth={layoutShouldBeFullWidth} />
      <Toaster />
    </div>
  );
};

export default AppLayout;
