
"use client";

import { useApp } from "@/providers/AppProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaRobot, FaBell, FaSpinner } from "react-icons/fa";
import { Coins, Wallet, BellRing, MessagesSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import RechargeCreditsDialog from './RechargeCreditsDialog';
import { cn } from "@/lib/utils";
import { MESSAGES_PER_CREDIT } from "@/config/appConfig";


const DashboardSummary = () => {
  const { state, enablePushNotifications: enablePushInContext, isSubscribingToPush } = useApp();
  const { assistants, credits, pushSubscriptions } = state.userProfile;
  
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'unsupported' | 'denied' | 'granted' | 'default'>('default');

  // Effect to check notification status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationStatus(Notification.permission);
    } else if (typeof window !== 'undefined') {
        setNotificationStatus('unsupported');
    }
  }, []);

  const handleEnableNotifications = async () => {
    await enablePushInContext();
    // After the attempt, re-check the permission status to update the UI correctly
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  };

  const hasActiveSubscription = pushSubscriptions && pushSubscriptions.length > 0;
  // A user has notifications active if the browser permission is granted.
  const isNotificationActive = notificationStatus === 'granted'; 
  const isNotificationPromptDefault = notificationStatus === 'default' && !hasActiveSubscription;
  const availableMessages = (credits || 0) * MESSAGES_PER_CREDIT;

  return (
    <>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" style={{animationDelay: "0.1s"}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistentes</CardTitle>
            <FaRobot className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {assistants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total configurados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn cursor-pointer" 
          style={{animationDelay: "0.2s"}}
          onClick={() => setIsRechargeOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary flex items-center gap-2">
              <Coins className="h-5 w-5 text-accent" /> {credits || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Clic para recargar
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 animate-fadeIn" 
          style={{animationDelay: "0.3s"}}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <MessagesSquare className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {availableMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para enviar
            </p>
          </CardContent>
        </Card>

        {!isNotificationActive && notificationStatus !== 'unsupported' && (
          <Card className={cn(
            "shadow-lg hover:shadow-xl transition-all duration-300 animate-fadeIn col-span-2 lg:col-span-1",
            isNotificationPromptDefault && "border-primary ring-2 ring-primary/50 shadow-primary/20"
          )} style={{animationDelay: "0.4s"}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <FaBell className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {notificationStatus === 'denied' ? (
                  <p className="text-xs text-muted-foreground pt-1">Bloqueadas. Habilítalas en la configuración de tu navegador.</p>
              ) : (
                <>
                  <Button size="sm" className="mt-2" onClick={handleEnableNotifications} disabled={isSubscribingToPush}>
                      {isSubscribingToPush ? <FaSpinner className="animate-spin mr-2" /> : <BellRing className="mr-2 h-4 w-4" />}
                      Activar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Recibe alertas importantes.</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <RechargeCreditsDialog isOpen={isRechargeOpen} onOpenChange={setIsRechargeOpen} />
    </>
  );
};

export default DashboardSummary;
