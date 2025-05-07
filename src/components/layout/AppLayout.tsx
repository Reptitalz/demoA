
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      {children}
      <Footer />
      <Toaster />
    </div>
  );
};

export default AppLayout;
