"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
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
          <Button asChild size="sm" className="hidden sm:flex bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105">
             <Link href="/app">
              <Download className="mr-1.5 h-4 w-4" />
              Obtener App
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
