
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import { Menu as MenuIcon } from 'lucide-react';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  return (
    <header className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 via-fuchsia-500 to-cyan-300 shadow-lg flex items-center justify-center">
                <AppIcon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="text-white font-bold">{APP_NAME}</h1>
                <p className="text-xs text-slate-300 -mt-1">PWA · Smart Assistants · Sales & Media Control</p>
            </div>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm text-slate-300">
          <a className="hover:text-white" href="#features">Funciones</a>
          <a className="hover:text-white" href="#ui">Interfaz</a>
          <a className="hover:text-white" href="#pricing">Precios</a>
          <a className="hover:text-white" href="#contact">Contacto</a>
        </nav>
        <div className="md:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MenuIcon />
                    <span className="sr-only">Abrir menú de navegación</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href="#features">Funciones</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="#ui">Interfaz</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="#pricing">Precios</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="#contact">Contacto</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/login">Acceder</Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
  );
};

export default Header;
