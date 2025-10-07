// src/app/chat/ChatNavBar.tsx
"use client";

import React, { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FaComment, FaCamera, FaUser, FaPlus } from 'react-icons/fa';

const navItems = [
    { href: '/chat/dashboard', label: 'Chats', icon: FaComment },
    { href: '/chat/updates', label: 'Novedades', icon: FaCamera },
    { href: '/chat/profile', label: 'Perfil', icon: FaUser },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  onNavigate: (path: string) => void;
}

const NavItem = ({ href, label, icon: Icon, onNavigate }: NavItemProps) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    onClick={() => onNavigate(href)}
                    className={cn(
                        "flex flex-col items-center justify-center h-full w-20 cursor-pointer transition-all duration-200",
                        "text-muted-foreground hover:text-primary",
                        isActive ? "text-primary" : ""
                    )}
                >
                    <Icon className={cn("h-6 w-6 transition-transform duration-200", isActive ? "scale-110" : "scale-100")} />
                    <span className={cn("text-xs mt-1 transition-opacity duration-200", isActive ? "opacity-100 font-semibold" : "opacity-80")}>{label}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

interface ChatNavBarProps {
    onNavigate: (path: string) => void;
}

const ChatNavBar = ({ onNavigate }: ChatNavBarProps) => {
    const pathname = usePathname();

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);
    const swipeHandled = useRef(false);

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

        if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) { // Increased from 75 to 100
            const currentIndex = navItems.findIndex(item => pathname.startsWith(item.href));
            if (currentIndex === -1) return;

            swipeHandled.current = true;
            if (deltaX < 0) { // Swiped left
                const nextIndex = (currentIndex + 1);
                if (nextIndex < navItems.length) {
                    onNavigate(navItems[nextIndex].href);
                }
            } else { // Swiped right
                const prevIndex = (currentIndex - 1);
                if (prevIndex >= 0) {
                    onNavigate(navItems[prevIndex].href);
                }
            }
        }
    };
    
    // Split items for layout
    const leftItems = navItems.slice(0, 2);
    const rightItems = navItems.slice(2);

    return (
        <TooltipProvider>
            <nav 
                className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t z-20"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="relative flex justify-around items-center h-full max-w-md mx-auto">
                    {/* Left Items */}
                    <div className="flex justify-around flex-1">
                        {leftItems.map(item => <NavItem key={item.href} {...item} onNavigate={onNavigate} />)}
                    </div>

                    {/* Center Button */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-[-20px]">
                         <button className="bg-brand-gradient text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg border-4 border-card">
                            <FaPlus className="text-xl" />
                        </button>
                    </div>

                    {/* Right Items */}
                    <div className="flex justify-around flex-1">
                        {rightItems.map(item => <NavItem key={item.href} {...item} onNavigate={onNavigate} />)}
                        {/* Add a placeholder div to balance the layout if rightItems has fewer items than leftItems */}
                         {leftItems.length > rightItems.length && (
                            <div className="w-20" />
                        )}
                    </div>
                </div>
            </nav>
        </TooltipProvider>
    );
};

export default ChatNavBar;
