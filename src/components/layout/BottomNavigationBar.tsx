
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, BarChart2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import RechargeCreditsDialog from '@/components/dashboard/RechargeCreditsDialog';

const BottomNavigationBar = () => {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);

  useEffect(() => {
    // Check if the app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "¡Aplicación Instalada!", description: "La aplicación se ha instalado correctamente." });
      }
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/app/consumption', label: 'Consumo', icon: BarChart2 },
  ];
  
  const actionItems = [
    {
        label: 'Recargar',
        icon: Wallet,
        onClick: () => setIsRechargeOpen(true),
        id: 'recharge',
    },
    ...(!isStandalone && deferredPrompt ? [{
        label: 'Instalar',
        icon: Download,
        onClick: handleInstallClick,
        id: 'install',
    }] : [])
  ];

  const isAppArea = pathname.startsWith('/dashboard') || pathname.startsWith('/app');

  if (pathname === '/login' || !isAppArea) {
    return null;
  }
  
  if (pathname === '/app' && !pathname.includes('consumption')) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-md md:hidden z-[60]">
        <div className="container mx-auto px-2 h-16 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.label}
                variant="ghost"
                asChild
                className={cn(
                  "flex flex-col items-center justify-center h-full w-full rounded-none text-xs p-1",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <Link href={item.href} className="flex flex-col items-center">
                  <item.icon className={cn("h-5 w-5 mb-0.5", isActive && "text-primary")} />
                  {item.label}
                </Link>
              </Button>
            );
          })}

          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={item.onClick}
                className={cn(
                  "flex flex-col items-center justify-center h-full w-full rounded-none text-xs p-1 text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
    </>
  );
};

export default BottomNavigationBar;
