
"use client"; // Necesario para usePathname
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation'; // Importar usePathname

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  // La página de marketing está en '/', las páginas de la app bajo '/app/'
  const isMarketingPage = pathname === '/'; 
  const layoutShouldBeFullWidth = isMarketingPage;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header fullWidth={layoutShouldBeFullWidth} />
      {children}
      <Footer fullWidth={layoutShouldBeFullWidth} />
      <Toaster />
    </div>
  );
};

export default AppLayout;
