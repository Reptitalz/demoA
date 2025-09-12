
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FaDatabase, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';
import NotificationsBell from '@/components/notifications/NotificationsBell';
import { signOut } from 'next-auth/react';
import { Bot, Brain } from 'lucide-react';

const menuItems = [
    { path: '/dashboard/assistants', icon: Bot, label: 'Asistentes' },
    { path: '/dashboard/databases', icon: Brain, label: 'Cerebro' },
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
    const { state, dispatch } = useApp();
    const { userProfile } = state;
    const isDemoMode = !userProfile.isAuthenticated;
    
    // State for swipe navigation
    const touchStartX = React.useRef(0);
    const touchEndX = React.useRef(0);
    const touchStartY = React.useRef(0);
    const touchEndY = React.useRef(0);
    const swipeHandled = React.useRef(false);

    // State for page transition animation
    const [isAnimating, setIsAnimating] = React.useState(false);

    const handleRouteChange = (newPath: string) => {
        if (pathname !== newPath) {
            setIsAnimating(true);
            setTimeout(() => {
                router.push(newPath);
                // The animation will reset when the pathname changes
            }, 150); // Duration of fade-out animation
        }
    };
    
    React.useEffect(() => {
        setIsAnimating(false);
    }, [pathname]);


    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        swipeHandled.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
        touchEndY.current = e.targetTouches[0].clientY;
    };

    const handleTouchEnd = () => {
        if (swipeHandled.current) return;

        const deltaX = touchEndX.current - touchStartX.current;
        const deltaY = touchEndY.current - touchStartY.current;

        // Ensure it's a horizontal swipe and not a vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            const currentIndex = menuItems.findIndex(item => pathname.startsWith(item.path));
            if (currentIndex === -1) return;

            if (deltaX < -50) { // Swiped left
                const nextIndex = (currentIndex + 1) % menuItems.length;
                handleRouteChange(menuItems[nextIndex].path);
            } else if (deltaX > 50) { // Swiped right
                const prevIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
                handleRouteChange(menuItems[prevIndex].path);
            }
            swipeHandled.current = true;
        }
    };


    const handleLogout = async () => {
        try {
            dispatch({ type: 'LOGOUT_USER' });
            await signOut({ callbackUrl: '/login' });
            toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
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
                        {!isDemoMode && <NotificationsBell />}
                        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs px-2 py-1"> 
                            <FaSignOutAlt size={12} className="mr-1" /> 
                            Cerrar Sesión
                        </Button>
                    </div>
                </header>
            <main 
                className={cn(
                    "flex-grow overflow-y-auto pb-20 transition-opacity duration-150",
                    isAnimating ? 'opacity-0' : 'opacity-100'
                )}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </main>
            <TooltipProvider>
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-10 md:hidden">
                    <div className="flex justify-around items-center h-full max-w-md mx-auto">
                        {menuItems.map(item => (
                            <Tooltip key={item.path}>
                                <TooltipTrigger asChild>
                                    <div
                                        onClick={() => handleRouteChange(item.path)}
                                        className={cn(
                                            "flex flex-col items-center justify-center h-full w-20 cursor-pointer transition-colors text-muted-foreground hover:text-primary",
                                            pathname.startsWith(item.path) && "text-primary"
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="text-[10px] mt-1">{item.label}</span>
                                    </div>
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
                                    <Button
                                        variant={pathname.startsWith(item.path) ? "default" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "rounded-full transition-all",
                                            pathname.startsWith(item.path) && "shadow-md"
                                        )}
                                        onClick={() => handleRouteChange(item.path)}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </Button>
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
