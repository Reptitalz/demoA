"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaChartBar, FaUser, FaSignInAlt, FaUserFriends, FaNewspaper } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { APP_NAME } from '@/config/appConfig';
import AppIcon from '@/components/shared/AppIcon';

const menuItems = [
    { path: '/democolaborator', icon: FaChartBar, label: 'Panel' },
    { path: '/democolaborator/clientes', icon: FaUserFriends, label: 'Clientes' },
    { path: '/democolaborator/novedades', icon: FaNewspaper, label: 'Novedades' },
    { path: '/democolaborator/profile', icon: FaUser, label: 'Perfil' },
];

export default function CollaboratorDemoLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    
    return (
        <div className="flex flex-col h-screen bg-muted/30">
             <header className="flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-20">
                <Link href="/democolaborator" className="flex items-center gap-2 font-semibold">
                    <AppIcon className="h-6 w-6" />
                    <span className="font-bold text-lg">{APP_NAME} <span className="text-sm font-normal text-muted-foreground">Colaboradores (Demo)</span></span>
                </Link>
                <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => router.push('/colaboradores/login')} className="text-xs px-2 py-1"> 
                        <FaSignInAlt size={12} className="mr-1" /> 
                        Iniciar Sesión
                    </Button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto pb-20">
                {children}
            </main>
            <TooltipProvider>
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-10 md:hidden">
                    <div className="flex justify-around items-center h-full max-w-md mx-auto">
                        {menuItems.map(item => (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    <Link href={item.path} passHref legacyBehavior>
                                        <div
                                            className={cn(
                                                "flex flex-col items-center justify-center h-full w-20 cursor-pointer transition-colors text-muted-foreground hover:text-primary",
                                                (pathname === item.path) && "text-primary"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            <span className="text-[10px] mt-1">{item.label}</span>
                                        </div>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </nav>
            </TooltipProvider>

             <nav className="hidden md:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-10">
                <TooltipProvider>
                    <div className="flex items-center gap-2 bg-card border shadow-lg rounded-full p-2">
                        {menuItems.map(item => (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                     <Link href={item.path} passHref legacyBehavior>
                                        <Button
                                            variant={(pathname === item.path) ? "default" : "ghost"}
                                            size="icon"
                                            className={cn(
                                                "rounded-full transition-all",
                                                (pathname === item.path) && "shadow-md"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
             </nav>
             <div className="fixed bottom-2 right-4 text-xs text-muted-foreground/80 z-10">
                Versión 1.0
            </div>
        </div>
    );
}
