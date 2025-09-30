
// src/app/chat/profile/page.tsx
"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FaUser, FaBell, FaKey, FaShieldAlt, FaQuestionCircle, FaSignOutAlt } from 'react-icons/fa';
import { signOut, useSession, signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/providers/AppProvider';
import { Badge } from '@/components/ui/badge';

const ProfileLink = ({ icon: Icon, text, onClick, disabled }: { icon: React.ElementType, text: string, onClick?: () => void, disabled?: boolean }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-card/80 cursor-pointer" onClick={!disabled ? onClick : undefined}>
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-base">{text}</span>
    </div>
);

const ChatProfilePage = () => {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const { state } = useApp();

  const mainAssistant = state.userProfile.assistants.find(a => a.type === 'desktop');
  const chatPath = mainAssistant?.chatPath;

  const handleLogout = () => {
      signOut({ callbackUrl: '/' });
  }

  const handleEnableNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast({ title: "No Soportado", description: "Tu navegador no soporta notificaciones push.", variant: "destructive" });
      return;
    }

    if (Notification.permission === "granted") {
      toast({ title: "Ya Activadas", description: "Las notificaciones ya están activadas." });
      return;
    }
    
    if (Notification.permission === "denied") {
       toast({ title: "Bloqueadas", description: "Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador.", variant: "destructive" });
       return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        
        // Send subscription to backend
        await fetch('/api/save-push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, userDbId: state.userProfile._id?.toString() }),
        });
        
        toast({ title: "¡Activadas!", description: "Recibirás notificaciones de ahora en adelante." });
      } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        toast({ title: "Error", description: "No se pudo suscribir a las notificaciones.", variant: "destructive" });
      }
    } else {
      toast({ title: "Permiso Denegado", description: "No se podrán enviar notificaciones." });
    }
  };


  return (
    <div className="flex flex-col h-full bg-transparent">
       <header className="p-4 border-b bg-card/80 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">Perfil</h1>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                     <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback><FaUser size={28}/></AvatarFallback>
                </Avatar>
                <div>
                     <p className="text-xl font-bold">{session?.user?.name || 'Invitado'}</p>
                     <p className="text-sm text-muted-foreground">{session?.user?.email || 'Inicia sesión para sincronizar'}</p>
                     {chatPath && (
                        <div className="mt-1">
                            <Badge variant="secondary">
                                Tu ID de chat: {chatPath}
                            </Badge>
                        </div>
                     )}
                </div>
            </div>

            {status !== 'authenticated' && (
                <Button className="w-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20" onClick={() => signIn('google')}>
                    <FcGoogle className="mr-2" /> Iniciar Sesión con Google
                </Button>
            )}
            
            <Separator />
            
            {/* Menu Options */}
            <div className="space-y-1">
                <ProfileLink icon={FaUser} text="Cuenta" />
                <ProfileLink icon={FaBell} text="Activar Notificaciones" onClick={handleEnableNotifications} disabled={status !== 'authenticated'}/>
                <ProfileLink icon={FaKey} text="Privacidad" />
                <ProfileLink icon={FaShieldAlt} text="Seguridad" />
                <ProfileLink icon={FaQuestionCircle} text="Ayuda" />
            </div>

             {status === 'authenticated' && (
                <>
                    <Separator />
                    <ProfileLink icon={FaSignOutAlt} text="Cerrar Sesión" onClick={handleLogout} />
                </>
            )}

        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatProfilePage;
