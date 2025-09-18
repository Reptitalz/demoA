// src/app/chat/profile/page.tsx
"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Bell, Key, Shield, HelpCircle, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

const ProfileLink = ({ icon: Icon, text, onClick }: { icon: React.ElementType, text: string, onClick?: () => void }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer" onClick={onClick}>
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-base">{text}</span>
    </div>
);

const ChatProfilePage = () => {
  const { data: session, status } = useSession();

  const handleLogout = () => {
      signOut();
  }

  return (
    <div className="flex flex-col h-full bg-background">
       <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Perfil</h1>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                     <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback><User size={28}/></AvatarFallback>
                </Avatar>
                <div>
                     <p className="text-xl font-bold">{session?.user?.name || 'Invitado'}</p>
                     <p className="text-sm text-muted-foreground">{session?.user?.email || 'Inicia sesión para sincronizar'}</p>
                </div>
            </div>

            {status !== 'authenticated' && (
                <Button className="w-full" onClick={() => signOut()}>
                    <FcGoogle className="mr-2" /> Iniciar Sesión con Google
                </Button>
            )}
            
            <Separator />
            
            {/* Menu Options */}
            <div className="space-y-1">
                <ProfileLink icon={User} text="Cuenta" />
                <ProfileLink icon={Bell} text="Notificaciones" />
                <ProfileLink icon={Key} text="Privacidad" />
                <ProfileLink icon={Shield} text="Seguridad" />
                <ProfileLink icon={HelpCircle} text="Ayuda" />
            </div>

             {status === 'authenticated' && (
                <>
                    <Separator />
                    <ProfileLink icon={LogOut} text="Cerrar Sesión" onClick={handleLogout} />
                </>
            )}

        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatProfilePage;
