
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const router = useRouter();

  const handleInstallClick = () => {
    // Always navigate to /access, which will now handle the installation logic.
    router.push('/access');
  };

  return (
    <header className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-white/10 shadow-lg flex items-center justify-center">
                <AppIcon className="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 className="text-white font-bold">{APP_NAME}</h1>
                <p className="text-xs text-slate-300 -mt-1">PWA · Asistentes Inteligentes · Ventas y Control de Medios</p>
            </div>
        </Link>
        
        <Button onClick={handleInstallClick} className="bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs sm:text-sm">
          <Download className="mr-2 h-4 w-4" />
          Instalar
        </Button>
      </header>
  );
};

export default Header;
