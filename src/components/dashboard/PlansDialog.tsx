// src/components/dashboard/PlansDialog.tsx

"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { FaSpinner, FaStar, FaInfoCircle, FaCheck } from 'react-icons/fa';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Loader2, MessageCircle, Landmark, ShoppingCart, CreditCard, XCircle, ShieldCheck, Crown } from 'lucide-react';
import PersonalInfoDialog from './PersonalInfoDialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface PlansDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PlanComparison = ({ onUpgrade }: { onUpgrade: () => void }) => {
    const plans = [
        {
            name: "Gratuito",
            description: "Para empezar a explorar",
            price: "$0",
            priceDetails: "/siempre",
            features: [
                'Máximo 100 mensajes por día para todos los bots.',
                'Autorización en banco limitada a 100 transacciones diarias.',
                'Catálogo de solo 5 artículos para la venta.',
                'Solo se puede ofrecer una línea de crédito.',
            ],
            button: <Button size="sm" className="w-full text-xs mt-2" disabled>Actualmente Activo</Button>
        },
        {
            name: "Ilimitado",
            description: "Desbloquea todo el potencial",
            price: "$179",
            priceDetails: "/al mes",
            features: [
                'Mensajes ilimitados para todos tus asistentes.',
                'Transacciones bancarias sin restricciones.',
                'Catálogo de productos ilimitado.',
                'Múltiples líneas de crédito para tus clientes.',
            ],
            button: <Button onClick={onUpgrade} size="sm" className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 shiny-border text-xs mt-2">
                        <Crown className="mr-2 h-3 w-3"/>
                        Obtener Plan
                    </Button>
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan, index) => (
                <div key={index} className={cn(
                    "rounded-xl p-6 flex flex-col border",
                    plan.name === "Ilimitado" ? "border-primary/50 bg-primary/5" : "bg-muted/30"
                )}>
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                        <span className="text-4xl font-extrabold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.priceDetails}</span>
                    </div>

                    <ul className="space-y-3 text-sm flex-grow">
                        {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <FaCheck className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto pt-6">
                        {plan.button}
                    </div>
                </div>
            ))}
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FaStar /> Planes y Beneficios
          </DialogTitle>
          <DialogDescription>
            Compara los planes y elige el que mejor se adapte a tus necesidades.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="py-4 pr-6 space-y-6">
              <PlanComparison onUpgrade={handlePurchasePlan} />
              
              {isProcessing && !preferenceId && (
                <div className="flex items-center justify-center p-4 rounded-lg bg-muted/50">
                    <FaSpinner className="animate-spin h-6 w-6 text-primary" />
                </div>
              )}
              
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
        </ScrollArea>
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
