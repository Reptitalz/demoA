"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaRobot, FaDatabase, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import {
    Sidebar,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarInset,
    SidebarHeader,
    SidebarFooter,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import AppIcon from '@/components/shared/AppIcon';
import { APP_NAME } from '@/config/appConfig';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
    const { dispatch } = useApp();
    const { toast } = useToast();
    const router = useRouter();

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT_USER' });
        toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
        router.replace('/login');
    };
    
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <AppIcon className="h-7 w-7" />
                        <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                            {APP_NAME}
                        </span>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    {menuItems.map(item => (
                        <SidebarMenuItem key={item.path}>
                            <Link href={item.path} passHref legacyBehavior>
                                <SidebarMenuButton
                                    isActive={pathname.startsWith(item.path)}
                                    tooltip={item.label}
                                >
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                                <FaSignOutAlt />
                                <span>Cerrar Sesión</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-12 items-center justify-between border-b bg-background/50 px-4 md:hidden">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                         <AppIcon className="h-6 w-6" />
                        <span className="sr-only">{APP_NAME}</span>
                    </Link>
                    <SidebarTrigger>
                        <FaBars />
                    </SidebarTrigger>
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
