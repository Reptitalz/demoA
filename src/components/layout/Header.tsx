
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignInAlt, FaRocket, FaBars, FaWhatsapp } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from '../ui/separator';

interface HeaderProps {
  fullWidth?: boolean;
}

const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.push(href);
        if (onClick) {
            onClick();
        }
    };
    
    return (
        <Link href={href} onClick={handleClick} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {children}
        </Link>
    );
};


const Header = ({ fullWidth = false }: HeaderProps) => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AppIcon className="h-8 w-8" />
            <h1 className="font-bold text-foreground text-lg">{APP_NAME}</h1>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-2">
                <NavLink href="/whatsapp">Productos</NavLink>
                <NavLink href="/#pricing">Precios</NavLink>
                <NavLink href="/colaboradores">Colaboradores</NavLink>
                <NavLink href="#contact">Contacto</NavLink>
            </nav>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <div className="flex items-center gap-2">
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <FaBars className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent title="Navegación Principal">
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                             <Link href="/" className="flex items-center gap-3" onClick={() => setIsSheetOpen(false)}>
                                <AppIcon className="h-8 w-8" />
                                <h1 className="font-bold text-foreground text-lg">{APP_NAME}</h1>
                            </Link>
                        </div>
                        <nav className="flex flex-col gap-2 p-4">
                            <NavLink href="/whatsapp" onClick={() => setIsSheetOpen(false)}>Productos</NavLink>
                            <NavLink href="/#pricing" onClick={() => setIsSheetOpen(false)}>Precios</NavLink>
                            <NavLink href="/colaboradores" onClick={() => setIsSheetOpen(false)}>Colaboradores</NavLink>
                            <NavLink href="#contact" onClick={() => setIsSheetOpen(false)}>Contacto</NavLink>
                        </nav>
                        <Separator />
                        <div className="p-4 mt-auto space-y-3">
                             <Button 
                                size="sm" 
                                onClick={() => { router.push('/make'); setIsSheetOpen(false); }}
                                className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border"
                              >
                                <FaRocket className="mr-2 h-4 w-4"/>
                                Crear Asistente
                            </Button>
                             <Button variant="outline" size="sm" className="w-full" onClick={() => { router.push('/login'); setIsSheetOpen(false); }}>
                                <FaSignInAlt className="mr-2 h-4 w-4" />
                                Iniciar sesión
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
