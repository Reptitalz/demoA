// src/components/chat/ChatSidebar.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FaComment, FaCamera, FaUser, FaCrown } from 'react-icons/fa';
import AppIcon from '../shared/AppIcon';

const navItems = [
    { href: '/chat/dashboard', label: 'Chats', icon: FaComment },
    { href: '/chat/updates', label: 'Novedades', icon: FaCamera },
    { href: '/chat/profile', label: 'Perfil', icon: FaUser },
    { href: '/chat/admin', label: 'Miembro', icon: FaCrown },
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
                        "flex items-center justify-start w-full p-3 rounded-lg cursor-pointer transition-all duration-200 gap-4",
                        "text-muted-foreground hover:text-primary hover:bg-muted",
                        isActive ? "text-primary bg-primary/10" : ""
                    )}
                >
                    <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive ? "scale-110" : "scale-100")} />
                    <span className={cn("text-sm transition-opacity duration-200", isActive ? "opacity-100 font-semibold" : "opacity-80")}>{label}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

interface ChatSidebarProps {
    onNavigate: (path: string) => void;
}

const ChatSidebar = ({ onNavigate }: ChatSidebarProps) => {
    return (
        <TooltipProvider>
            <aside className="w-64 h-full bg-card border-r flex flex-col p-3">
                <div className="flex items-center gap-2 p-3 mb-4">
                    <AppIcon className="h-8 w-8" />
                    <h2 className="font-bold text-lg">Hey Manito!</h2>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map(item => <NavItem key={item.href} {...item} onNavigate={onNavigate} />)}
                </nav>
            </aside>
        </TooltipProvider>
    );
};

export default ChatSidebar;
