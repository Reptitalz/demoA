// src/components/dashboard/PlansDialog.tsx

"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaStar, FaInfoCircle } from 'react-icons/fa';
import { MONTHLY_PLAN_CREDIT_COST, PRICE_PER_CREDIT } from '@/config/appConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Loader2, MessageCircle, Landmark, ShoppingCart, CreditCard, XCircle, ShieldCheck, Crown } from 'lucide-react';
import PersonalInfoDialog from './PersonalInfoDialog';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { List, ListItem } from '../ui/list';

interface PlansDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlanCarousel = ({ onUpgrade }: { onUpgrade: () => void }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const plans = [
        {
            name: "Plan Gratuito",
            icon: XCircle,
            iconClass: "text-destructive",
            badge: <Badge variant="destructive">Limitaciones Activas</Badge>,
            features: [
                { icon: MessageCircle, text: 'Máximo 100 mensajes por día para todos los bots.' },
                { icon: Landmark, text: 'Autorización en banco limitada a 100 transacciones diarias.' },
                { icon: ShoppingCart, text: 'Catálogo de solo 5 artículos para la venta.' },
                { icon: CreditCard, text: 'Solo se puede ofrecer una línea de crédito.' },
            ],
            button: <Button size="sm" className="w-full text-xs mt-2" disabled>Actualmente Activo</Button>
        },
        {
            name: "Plan Mensual: Ilimitado",
            icon: ShieldCheck,
            iconClass: "text-green-500",
            badge: <Badge variant="default" className="bg-green-500 hover:bg-green-600">Recomendado</Badge>,
            features: [
                { icon: MessageCircle, text: 'Mensajes ilimitados para todos tus asistentes.' },
                { icon: Landmark, text: 'Transacciones bancarias sin restricciones.' },
                { icon: ShoppingCart, text: 'Catálogo de productos ilimitado.' },
                { icon: CreditCard, text: 'Múltiples líneas de crédito para tus clientes.' },
            ],
            button: <Button onClick={onUpgrade} size="sm" className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs mt-2">
                        <Crown className="mr-2 h-3 w-3"/>
                        Obtener Plan por $179/mes
                    </Button>
        }
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const scrollLeft = scrollRef.current.scrollLeft;
                const cardWidth = scrollRef.current.offsetWidth;
                if (cardWidth > 0) {
                    const newIndex = Math.round(scrollLeft / cardWidth);
                    setActiveIndex(newIndex);
                }
            }
        };

        const scroller = scrollRef.current;
        if (scroller) {
            scroller.addEventListener('scroll', handleScroll, { passive: true });
            return () => scroller.removeEventListener('scroll', handleScroll);
        }
    }, []);

    return (
        <div className="w-full">
            <div
                ref={scrollRef}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide md:grid md:grid-cols-2 md:gap-4"
            >
                {plans.map((plan, index) => (
                     <div key={index} className="w-full flex-shrink-0 snap-center p-2 md:p-0">
                        <Card className="w-full text-left glow-card bg-card border shadow-lg overflow-hidden h-full flex flex-col">
                             <CardHeader className="p-4 bg-muted/50 border-b">
                                <div className="flex items-center justify-between">
                                   <CardTitle className="text-base flex items-center gap-2">
                                      <plan.icon className={cn("h-5 w-5", plan.iconClass)} />
                                      {plan.name}
                                   </CardTitle>
                                   {plan.badge}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3 flex-grow">
                                <List>
                                    {plan.features.map((item, itemIndex) => (
                                        <ListItem key={itemIndex} className="text-xs">
                                            <item.icon className="h-3 w-3 mr-2 shrink-0" />
                                            {item.text}
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                             <div className="p-4 pt-0 mt-auto">
                                {plan.button}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
             <div className="flex justify-center mt-2 space-x-2 md:hidden">
                {plans.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (scrollRef.current) {
                                const cardWidth = scrollRef.current.offsetWidth;
                                scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                            }
                        }}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all",
                            activeIndex === index ? "w-4 bg-primary" : "bg-muted-foreground/50"
                        )}
                        aria-label={`Ir al plan ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};


const PlansDialog = ({ isOpen, onOpenChange }: PlansDialogProps) => {
  const { state, dispatch } = useApp();
  const { userProfile } = state;
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPersonalInfoDialogOpen, setIsPersonalInfoDialogOpen] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  if (publicKey) {
    initMercadoPago(publicKey, { locale: 'es-MX' });
  }
  
  useEffect(() => {
    if (!isOpen) {
        setPreferenceId(null);
        setIsProcessing(false);
    }
  }, [isOpen]);


  const handlePurchasePlan = async () => {
     if (!userProfile.firstName || !userProfile.lastName) {
      toast({
        title: "Información Requerida",
        description: "Completa tu información personal para poder comprar.",
        variant: "default",
      });
      setIsPersonalInfoDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    setPreferenceId(null);
    try {
        const response = await fetch('/api/create-mercadopago-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                purchaseType: 'plan', 
                userDbId: userProfile._id?.toString() 
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el pago.');
        if (data.preferenceId) setPreferenceId(data.preferenceId);

    } catch (error: any) {
        toast({ title: 'Error al iniciar pago', description: error.message, variant: 'destructive' });
        setIsProcessing(false);
    }
  };
  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FaStar /> Planes y Beneficios
          </DialogTitle>
          <DialogDescription>
            Compara los planes y elige el que mejor se adapte a tus necesidades.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <PlanCarousel onUpgrade={handlePurchasePlan} />
            
            {preferenceId && (
                <div className="animate-fadeIn flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-4">Completa tu compra de forma segura.</p>
                    <Wallet 
                        initialization={{ preferenceId: preferenceId }}
                        customization={{ texts: { valueProp: 'smart_option'}}}
                        onReady={() => setIsProcessing(false)}
                    />
                </div>
            )}
             <div className="text-xs p-3 rounded-md flex items-start gap-2 bg-blue-500/10 text-blue-700">
                <FaInfoCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                    El Plan Mensual Ilimitado se aplica a un solo asistente. Puedes comprar múltiples planes y asignarlos a diferentes asistentes según lo necesites.
                </p>
           </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <PersonalInfoDialog
        isOpen={isPersonalInfoDialogOpen}
        onOpenChange={setIsPersonalInfoDialogOpen}
    />
    </>
  );
};

export default PlansDialog;
