// src/app/chat/ChatNavBar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageSquare, Camera, User, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: '/chat/dashboard', label: 'Chats', icon: MessageSquare },
    { href: '/chat/updates', label: 'Novedades', icon: Camera },
    { href: '/chat/profile', label: 'Perfil', icon: User },
    { href: '/chat/admin', label: 'Admin', icon: Settings },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  onNavigate: (path: string) => void;
}

const NavItem = ({ href, label, icon: Icon, onNavigate }: NavItemProps) => {
    const pathname = usePathname();
    // Check if the current path starts with the nav item's href.
    // This makes the 'Chats' icon active for both /chat and /chat/dashboard
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
    return (
        <TooltipProvider>
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t z-20 shrink-0">
                <div className="flex justify-around items-center h-full max-w-md mx-auto">
                    {navItems.map(item => <NavItem key={item.href} {...item} onNavigate={onNavigate} />)}
                </div>
            </nav>
        </TooltipProvider>
    );
};

export default ChatNavBar;
