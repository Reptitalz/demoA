
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { FaDownload, FaSignInAlt } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const router = useRouter();
  const [isPWA, setIsPWA] = React.useState(false);

    React.useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsPWA(true);
        }
    }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AppIcon className="h-8 w-8" />
            <h1 className="font-bold text-foreground text-lg">{APP_NAME}</h1>
        </Link>
        
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                <FaSignInAlt className="mr-2 h-4 w-4" />
                Iniciar sesión
            </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
