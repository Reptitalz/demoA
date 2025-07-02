
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaRobot, FaBell, FaSpinner } from "react-icons/fa";
import { Coins, Wallet, BellRing } from 'lucide-react';
import { useState, useEffect } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { useToast } from "@/hooks/use-toast";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { auth } from '@/lib/firebase';

const DashboardSummary = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { assistants, credits, pushSubscriptions } = state.userProfile;
  
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unsupported' | 'denied' | 'granted' | 'default'>('default');

  // Effect to check notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationStatus(Notification.permission);
    } else if (typeof window !== 'undefined') {
        setNotificationStatus('unsupported');
    }
  }, []);

  const hasActiveSubscription = pushSubscriptions && pushSubscriptions.length > 0;

  const handleEnableNotifications = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("VAPID public key is not set in .env.local");
      toast({ title: "Error de Configuración", description: "El administrador no ha configurado las notificaciones.", variant: "destructive" });
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Permiso Denegado", description: "No se podrán activar las notificaciones." });
        setNotificationStatus('denied');
        return;
      }
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Usuario no autenticado.");
      
      const response = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) throw new Error('No se pudo guardar la suscripción en el servidor.');
      
      dispatch({ type: 'ADD_PUSH_SUBSCRIPTION', payload: subscription.toJSON() });
      setNotificationStatus('granted');
      toast({ title: "¡Notificaciones Activadas!", description: "Recibirás alertas y actualizaciones." });

    } catch (error) {
      console.error("Error subscribing:", error);
      toast({ title: "Error", description: "No se pudieron activar las notificaciones.", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.1s"}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistentes Configurados</CardTitle>
            <FaRobot className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {assistants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de asistentes creados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn cursor-pointer" 
          style={{animationDelay: "0.2s"}}
          onClick={() => setIsRechargeOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo de Créditos</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" /> {credits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clic para recargar saldo
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn col-span-2 md:col-span-1" style={{animationDelay: "0.3s"}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones Push</CardTitle>
            <FaBell className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {notificationStatus === 'granted' || hasActiveSubscription ? (
                <>
                  <div className="text-2xl font-bold text-green-500">Activadas</div>
                  <p className="text-xs text-muted-foreground">Recibirás alertas y actualizaciones.</p>
                </>
            ) : notificationStatus === 'denied' ? (
                <p className="text-xs text-muted-foreground pt-1">Bloqueadas. Habilítalas en la configuración de tu navegador.</p>
            ) : notificationStatus === 'unsupported' ? (
                <p className="text-xs text-muted-foreground pt-1">No soportado en este navegador.</p>
            ) : (
              <>
                <Button size="sm" className="mt-2" onClick={handleEnableNotifications} disabled={isSubscribing}>
                    {isSubscribing ? <FaSpinner className="animate-spin mr-2" /> : <BellRing className="mr-2 h-4 w-4" />}
                    Activar
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Recibe alertas de tus asistentes.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
    </>
  );
};

export default DashboardSummary;
