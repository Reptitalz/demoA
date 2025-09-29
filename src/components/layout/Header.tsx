
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Download, LogIn } from 'lucide-react';
import AppIcon from '@/components/shared/AppIcon';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsPWA(true);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }
  }, []);

  const handleInstallClick = () => {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
            if (choiceResult.outcome === 'accepted') {
                toast({ title: "¡Aplicación Instalada!", description: `Gracias por instalar ${APP_NAME}.` });
            }
            setDeferredInstallPrompt(null);
        });
    } else {
        router.push('/access');
    }
  };

  const InstallButton = useMemo(() => {
    if (isPWA) {
        return (
            <Button onClick={() => router.push('/login')} className="bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs sm:text-sm">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
            </Button>
        );
    }
    
     return (
        <Button onClick={handleInstallClick} className="bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs sm:text-sm">
            <Download className="mr-2 h-4 w-4" /> Instalar App
        </Button>
    );
  }, [isPWA, deferredInstallPrompt, router]);

  return (
    <header className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-card shadow-lg flex items-center justify-center p-1.5">
                <AppIcon />
            </div>
            <div>
                <h1 className="font-bold text-foreground">{APP_NAME}</h1>
                <p className="text-xs text-muted-foreground -mt-1">PWA · Asistentes Inteligentes · Ventas y Control de Medios</p>
            </div>
        </Link>
        
        <div className="flex items-center gap-2">
            {InstallButton}
        </div>
      </header>
  );
};

export default Header;
