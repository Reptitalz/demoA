
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { MessagesSquare, Coins, Wallet as WalletIcon, Loader2, Banknote } from 'lucide-react';
import { CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT, MAX_CUSTOM_CREDITS } from '@/config/appConfig';
import { Button } from '../ui/button';
import MercadoPagoIcon from '@/components/shared/MercadoPagoIcon';

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const { userProfile } = state;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'custom'>('packages');
  const [selectedPackageCredits, setSelectedPackageCredits] = useState<number>(CREDIT_PACKAGES[0].credits);
  const [customCredits, setCustomCredits] = useState<number>(1);
  
  const creditsToPurchase = activeTab === 'packages' ? selectedPackageCredits : customCredits;
  
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setActiveTab('packages');
      setSelectedPackageCredits(CREDIT_PACKAGES[0].credits);
      setCustomCredits(1);
    }
  }, [isOpen]);

  const redirectToCheckoutPro = async () => {
    if (!creditsToPurchase || creditsToPurchase <= 0) {
      toast({ title: "Selección Requerida", description: "Por favor, selecciona o ingresa una cantidad de créditos válida.", variant: "destructive" });
      return;
    }
    
    if (!userProfile._id) {
      toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
        const response = await fetch('/api/create-mercadopago-preference', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              credits: creditsToPurchase,
              userDbId: userProfile._id.toString(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo crear la orden de pago.');
        }
        
        if (data.initPointUrl) {
            window.location.href = data.initPointUrl;
        } else {
            throw new Error('No se recibió la URL de pago. Por favor, intenta de nuevo.');
        }
    } catch (error: any) {
        toast({ title: "Error al generar orden", description: error.message, variant: "destructive" });
        setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };
  
  const purchaseAmount = activeTab === 'packages' 
    ? (CREDIT_PACKAGES.find(p => p.credits === selectedPackageCredits)?.price || 0)
    : customCredits * PRICE_PER_CREDIT;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <WalletIcon className="h-6 w-6 text-primary" /> Recargar Saldo
          </DialogTitle>
          <DialogDescription>
            Añade créditos a tu cuenta para continuar usando tus asistentes. Serás redirigido a Mercado Pago para completar la compra de forma segura.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-accent" />
                    <p className="text-2xl font-bold">{userProfile.credits || 0}</p>
                    <span className="text-xs text-muted-foreground mt-2">Créditos</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <MessagesSquare className="h-5 w-5 text-accent" />
                    <p className="text-2xl font-bold">{((userProfile.credits || 0) * MESSAGES_PER_CREDIT).toLocaleString()}</p>
                    <span className="text-xs text-muted-foreground mt-2">Mensajes</span>
                </div>
              </div>
          </div>
          
          <Tabs defaultValue="packages" className="w-full" onValueChange={(value) => setActiveTab(value as 'packages' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="packages">Paquetes</TabsTrigger>
                  <TabsTrigger value="custom">Personalizar</TabsTrigger>
              </TabsList>
              <TabsContent value="packages" className="pt-2">
                  <RadioGroup
                      value={selectedPackageCredits.toString()}
                      onValueChange={(value) => setSelectedPackageCredits(Number(value))}
                      className="mt-2 grid grid-cols-2 gap-3"
                  >
                      {CREDIT_PACKAGES.map((pkg) => {
                          const messages = Math.floor(pkg.credits * MESSAGES_PER_CREDIT);
                          return (
                            <Label
                                key={pkg.credits}
                                htmlFor={`pkg-${pkg.credits}`}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary has-[input:checked]:ring-1 has-[input:checked]:ring-primary"
                                )}
                            >
                                <RadioGroupItem value={pkg.credits.toString()} id={`pkg-${pkg.credits}`} className="sr-only" />
                                <p className="font-bold text-base">{pkg.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    ${pkg.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                </p>
                                <p className="text-xs text-muted-foreground/80">({messages.toLocaleString()} mensajes)</p>
                            </Label>
                          )
                      })}
                  </RadioGroup>
              </TabsContent>
              <TabsContent value="custom" className="pt-4 space-y-4">
                  <div className="space-y-2">
                      <div className="flex justify-between items-center font-semibold text-lg">
                          <span className="flex items-center gap-2">Créditos</span>
                          <span className="text-primary">{customCredits}</span>
                      </div>
                      <Slider
                          value={[customCredits]}
                          onValueChange={(value) => setCustomCredits(value[0])}
                          min={1}
                          max={MAX_CUSTOM_CREDITS}
                          step={1}
                          aria-label="Selector de créditos"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>{MAX_CUSTOM_CREDITS}</span>
                      </div>
                       <div className="p-3 bg-muted/50 rounded-lg text-center mt-2">
                          <p className="text-sm text-muted-foreground mb-1">Costo Total</p>
                          <p className="text-xl font-bold">${purchaseAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</p>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
            <div className="flex-col gap-2 pt-2">
              <Button
                  className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105"
                  onClick={redirectToCheckoutPro}
                  disabled={isProcessing}
              >
                  {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Banknote className="mr-2 h-4 w-4" />}
                  Continuar al Pago
              </Button>
              <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-xs text-muted-foreground">Paga de forma segura con</p>
                  <MercadoPagoIcon className="h-5"/>
              </div>
               <p className="text-center text-xs text-muted-foreground pt-2">Aceptamos tarjetas, SPEI, OXXO y más a través de Mercado Pago.</p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RechargeCreditsDialog;
