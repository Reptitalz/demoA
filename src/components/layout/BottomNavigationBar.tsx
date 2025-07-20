
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useApp } from '@/providers/AppProvider';


const BottomNavigationBar = () => {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  const [isStandalone, setIsStandalone] = useState(false);
  const { enablePushNotifications } = useApp();

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
        toast({ title: "¡Aplicación Instalada!", description: "A continuación, activa las notificaciones para una mejor experiencia." });
        // Wait a bit for the toast to show, then prompt for notifications
        setTimeout(async () => {
          await enablePushNotifications();
        }, 2500);
      }
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
  ];

  const isAppArea = pathname.startsWith('/dashboard');

  if (pathname === '/app/setup' || !isAppArea) {
    return null;
  }

  const showInstallButton = !!deferredPrompt;

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

          {!isStandalone && (
            showInstallButton ? (
               <Button
                  variant="ghost"
                  onClick={handleInstallClick}
                  className={cn(
                    "flex flex-col items-center justify-center h-full w-full rounded-none text-xs p-1 text-primary font-semibold" 
                  )}
                >
                  <Download className="h-5 w-5 mb-0.5 text-primary" />
                  Instalar
                </Button>
            ) : (
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "flex flex-col items-center justify-center h-full w-full rounded-none text-xs p-1 text-muted-foreground"
                )}
              >
                <Link href="/app" className="flex flex-col items-center">
                  <Download className="h-5 w-5 mb-0.5" />
                  Obtener App
                </Link>
              </Button>
            )
          )}
        </div>
      </nav>
    </>
  );
};

export default BottomNavigationBar;
