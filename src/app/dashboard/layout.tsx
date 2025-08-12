"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaRobot, FaDatabase, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const menuItems = [
    { path: '/dashboard/assistants', icon: FaRobot, label: 'Asistentes' },
    { path: '/dashboard/databases', icon: FaDatabase, label: 'Bases de Datos' },
    { path: '/dashboard/profile', icon: FaUser, label: 'Perfil' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth); // Sign out from Firebase
            toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
            // The onAuthStateChanged listener in AppProvider will handle state cleanup and redirection
        } catch (error) {
            console.error("Logout Error:", error);
            toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-muted/30">
             <header className="flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-20">
                    <Link href="/dashboard/assistants" className="flex items-center gap-2 font-semibold">
                         <AppIcon className="h-6 w-6" />
                        <span className="font-bold text-lg">{APP_NAME}</span>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        
                        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-2 py-1"> 
                            <FaSignOutAlt size={12} className="mr-1" /> 
                            Cerrar Sesión
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
                                                pathname.startsWith(item.path) && "text-primary"
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
                                            variant={pathname.startsWith(item.path) ? "default" : "ghost"}
                                            size="icon"
                                            className={cn(
                                                "rounded-full transition-all",
                                                pathname.startsWith(item.path) && "shadow-md"
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
                Versión 0.1
            </div>
        </div>
    );
}