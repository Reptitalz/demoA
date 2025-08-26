"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import { Download, Menu as MenuIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useApp } from '@/providers/AppProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { FaBars, FaChevronRight } from 'react-icons/fa';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const { state } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
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
        toast({ title: "¡Aplicación Instalada!", description: "La aplicación se ha instalado en tu dispositivo." });
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const showInstallButton = !!deferredPrompt && !isStandalone;

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className={cn(
        "container mx-auto px-4 py-3 flex items-center justify-between",
        !fullWidth && "max-w-7xl"
      )}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <AppIcon 
            className="h-7 w-7"
            aria-label={`${APP_NAME} Icon`} 
          />
          <h1 className="text-xl font-bold text-brand-gradient">{APP_NAME}</h1>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FaBars />
                <span className="sr-only">Abrir menú de navegación</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Productos</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem asChild>
                       <Link href="/">WhatsApp Asistente</Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              
               <DropdownMenuItem asChild>
                <Link href="/colaboradores" >Colaboradores/aliados</Link>
              </DropdownMenuItem>

              {showInstallButton && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleInstallClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Instalar App
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
