
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React from 'react';
import { useRouter } from 'next/navigation';
import { FaSignInAlt } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { FaChevronDown } from 'react-icons/fa';
import { FaWhatsapp, FaUserFriends, FaRocket, FaEnvelope } from 'react-icons/fa';

interface HeaderProps {
  fullWidth?: boolean;
}

const Header = ({ fullWidth = false }: HeaderProps) => {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AppIcon className="h-8 w-8" />
            <h1 className="font-bold text-foreground text-lg">{APP_NAME}</h1>
        </Link>
        
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        Productos <FaChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => router.push('/whatsapp')}>
                        <FaWhatsapp className="mr-2" /> Hey Manito! WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/colaboradores')}>
                        <FaUserFriends className="mr-2" /> Colaboradores
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

             <Button variant="ghost" size="sm" asChild>
              <Link href="#contact">Contacto</Link>
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                <FaSignInAlt className="mr-2 h-4 w-4" />
                Iniciar sesión
            </Button>

             <Button 
                size="sm" 
                onClick={() => router.push('/make')}
                className="bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border"
              >
                <FaRocket className="mr-2 h-4 w-4"/>
                Crear Asistente
            </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
