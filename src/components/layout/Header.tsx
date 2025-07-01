
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser's default install prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // If we have a deferred prompt, show it
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "¡Aplicación Instalada!", description: "Gracias por instalar la aplicación." });
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      // We can only use the prompt once, so clear it.
      setDeferredPrompt(null);
    }
  };

  const showInstallButton = !!deferredPrompt;

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className={cn(
        "container mx-auto px-4 py-3 flex items-center justify-between",
        !fullWidth && "max-w-md"
      )}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <AppIcon 
            className="h-7 w-7"
            aria-label={`${APP_NAME} Icon`} 
          />
          <h1 className="text-xl font-bold text-brand-gradient">{APP_NAME}</h1>
        </Link>
        <div className="flex items-center gap-2">
          {showInstallButton ? (
            <Button 
              size="sm" 
              className="hidden sm:flex bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105"
              onClick={handleInstallClick}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Instalar App
            </Button>
          ) : (
             <Button asChild size="sm" className="hidden sm:flex bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105">
               <Link href="/app">
                <Download className="mr-1.5 h-4 w-4" />
                Obtener App
              </Link>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
