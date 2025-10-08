
"use client";
import Link from 'next/link';
import { APP_NAME } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignInAlt } from 'react-icons/fa';
import AppIcon from '@/components/shared/AppIcon';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FaChevronDown, FaWhatsapp, FaUserFriends, FaRocket, FaEnvelope, FaBars } from 'react-icons/fa';
import { Separator } from '../ui/separator';

interface HeaderProps {
  fullWidth?: boolean;
}

const NavLinks = ({ inSheet = false }: { inSheet?: boolean }) => {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        router.push(path);
        if (inSheet) {
            // Logic to close the sheet would go here if needed, managed by the parent.
        }
    };

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => handleNavigation('/whatsapp')}>
                <FaWhatsapp className="mr-2" /> Hey Manito! WhatsApp
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleNavigation('/colaboradores')}>
                <FaUserFriends className="mr-2" /> Colaboradores
            </Button>
            <Button variant="ghost" size="sm" asChild>
                <Link href="#contact">Contacto</Link>
            </Button>
        </>
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
            <NavLinks />
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <FaBars className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b">
                             <Link href="/" className="flex items-center gap-3" onClick={() => setIsSheetOpen(false)}>
                                <AppIcon className="h-8 w-8" />
                                <h1 className="font-bold text-foreground text-lg">{APP_NAME}</h1>
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2 p-4">
                            <NavLinks inSheet={true} />
                        </div>
                        <Separator />
                        <div className="p-4 mt-auto space-y-2">
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
