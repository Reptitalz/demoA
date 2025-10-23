
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaSignInAlt, FaRocket, FaBars, FaWhatsapp } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from '../ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

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
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isWhatsAppPage = pathname === '/whatsapp';
  const createButtonAction = () => router.push(isWhatsAppPage ? '/login' : '/load');
  const createButtonMobileAction = () => {
    router.push(isWhatsAppPage ? '/login' : '/load');
    setIsSheetOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AppIcon className="h-8 w-8" />
            <div className="flex flex-col -space-y-1.5">
              <span className="font-extrabold text-foreground text-lg leading-none">Hey</span>
              <span className="font-semibold text-muted-foreground text-lg leading-none">Manito!</span>
            </div>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            Productos
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => router.push('/')}>
                            Hey Manito! App
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/whatsapp')}>
                            Hey Manito! WhatsApp
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <NavLink href="/colaboradores">Colaboradores</NavLink>
                <NavLink href="/#pricing">Precios</NavLink>
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
                    onClick={createButtonAction}
                    className={cn(
                      "text-primary-foreground hover:opacity-90 shiny-border",
                      "bg-green-gradient"
                    )}
                  >
                    {isWhatsAppPage ? <FaWhatsapp className="mr-2 h-4 w-4" /> : <FaRocket className="mr-2 h-4 w-4"/>}
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
                                <div className="flex flex-col -space-y-1.5">
                                  <span className="font-extrabold text-foreground text-lg leading-none">Hey</span>
                                  <span className="font-semibold text-muted-foreground text-lg leading-none">Manito!</span>
                                </div>
                            </Link>
                        </div>
                        <nav className="flex flex-col gap-2 p-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="justify-start px-3 py-2 font-medium text-muted-foreground">
                                        Productos
                                        <ChevronDown className="h-4 w-4 ml-auto" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56">
                                     <DropdownMenuItem onSelect={() => { router.push('/'); setIsSheetOpen(false); }}>
                                        Hey Manito! App
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => { router.push('/whatsapp'); setIsSheetOpen(false); }}>
                                        Hey Manito! WhatsApp
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <NavLink href="/colaboradores" onClick={() => setIsSheetOpen(false)}>Colaboradores</NavLink>
                            <NavLink href="/#pricing" onClick={() => setIsSheetOpen(false)}>Precios</NavLink>
                            <NavLink href="#contact" onClick={() => setIsSheetOpen(false)}>Contacto</NavLink>
                        </nav>
                        <Separator />
                        <div className="p-4 mt-auto space-y-3">
                             <Button 
                                size="sm" 
                                onClick={createButtonMobileAction}
                                className={cn(
                                  "w-full text-primary-foreground hover:opacity-90 shiny-border",
                                  "bg-green-gradient"
                                )}
                              >
                                {isWhatsAppPage ? <FaWhatsapp className="mr-2 h-4 w-4" /> : <FaRocket className="mr-2 h-4 w-4"/>}
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
