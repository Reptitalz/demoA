
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
} from '@/components/ui/dropdown-menu';
import { FaBars } from 'react-icons/fa';
import NotificationsBell from '../notifications/NotificationsBell';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
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
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FaBars />
                <span className="sr-only">Abrir menú de navegación</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/access">Acceder / Instalar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/begin">Crear Asistente</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/#pricing">Precios</Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/colaboradores">Colaboradores</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center justify-between">
                <span>Alternar Tema</span>
                <ThemeToggle />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
