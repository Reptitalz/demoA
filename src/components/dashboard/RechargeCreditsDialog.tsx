
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { MessagesSquare, Coins, Wallet, Loader2, Banknote } from 'lucide-react';
import { CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT, MAX_CUSTOM_CREDITS } from '@/config/appConfig';
import { initMercadoPago, Wallet as MercadoPagoWallet } from '@mercadopago/sdk-react';

const MERCADOPAGO_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "TEST-c89b7878-13f8-45a8-9467-f53e340a631f";

initMercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'es-MX' });

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const { userProfile } = state;
  const currentCredits = userProfile.credits || 0;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'packages' | 'custom'>('packages');
  const [selectedPackageCredits, setSelectedPackageCredits] = useState<number>(CREDIT_PACKAGES[0].credits);
  const [customCredits, setCustomCredits] = useState<number>(1);
  
  const creditsToPurchase = activeTab === 'packages' ? selectedPackageCredits : customCredits;
  
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setPreferenceId(null);
      setActiveTab('packages');
      setSelectedPackageCredits(CREDIT_PACKAGES[0].credits);
      setCustomCredits(1);
    }
  }, [isOpen]);

  const createPaymentPreference = async () => {
    if (!creditsToPurchase || creditsToPurchase <= 0) {
      toast({ title: "Selección Requerida", description: "Por favor, selecciona o ingresa una cantidad de créditos válida.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    setPreferenceId(null);

    try {
        if (!userProfile.phoneNumber) {
            throw new Error("No estás autenticado. Por favor, inicia sesión de nuevo.");
        }

        const response = await fetch('/api/create-mercadopago-preference', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              credits: creditsToPurchase,
              userPhoneNumber: userProfile.phoneNumber
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo crear la orden de pago.');
        }
        
        if (data.preferenceId) {
            setPreferenceId(data.preferenceId);
        } else {
            throw new Error('No se recibió el ID de la preferencia de pago. Por favor, intenta de nuevo.');
        }

    } catch (error: any) {
        toast({ title: "Error al generar orden", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-6 w-6 text-primary" /> Recargar Saldo
          </DialogTitle>
          <DialogDescription>
            Añade créditos a tu cuenta para continuar usando tus asistentes.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
              <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" />
                  <p className="text-2xl font-bold">{currentCredits}</p>
                  <span className="text-xs text-muted-foreground mt-2">Créditos</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                  <MessagesSquare className="h-5 w-5 text-accent" />
                  <p className="text-2xl font-bold">{(currentCredits * MESSAGES_PER_CREDIT).toLocaleString()}</p>
                  <span className="text-xs text-muted-foreground mt-2">Mensajes</span>
              </div>
              </div>
          </div>
          
          <Tabs defaultValue="packages" className="w-full" onValueChange={(value) => setActiveTab(value as 'packages' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="packages" disabled={!!preferenceId}>Paquetes</TabsTrigger>
                  <TabsTrigger value="custom" disabled={!!preferenceId}>Personalizar</TabsTrigger>
              </TabsList>
              <TabsContent value="packages" className="pt-2">
                  <RadioGroup
                      value={selectedPackageCredits.toString()}
                      onValueChange={(value) => setSelectedPackageCredits(Number(value))}
                      className="mt-2 grid grid-cols-2 gap-3"
                  >
                      {CREDIT_PACKAGES.map((pkg) => {
                          const priceWithIva = pkg.price * 1.16;
                          return (
                          <Label
                              key={pkg.credits}
                              htmlFor={`pkg-${pkg.credits}`}
                              className={cn(
                                  "flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary has-[input:checked]:ring-1 has-[input-checked]:ring-primary",
                                  !!preferenceId && "opacity-50 cursor-not-allowed"
                              )}
                          >
                              <RadioGroupItem value={pkg.credits.toString()} id={`pkg-${pkg.credits}`} className="sr-only" disabled={!!preferenceId}/>
                              <p className="font-bold text-lg">{pkg.credits} Créditos</p>
                              <p className="text-sm text-muted-foreground">
                                  ${priceWithIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                              </p>
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
                          disabled={!!preferenceId}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>{MAX_CUSTOM_CREDITS}</span>
                      </div>
                  </div>
              </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="flex-col gap-3">
          {preferenceId ? (
            <div id="wallet_container" className="w-full [&>div>iframe]:min-h-[250px]">
                <MercadoPagoWallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground text-center">
                  Aceptamos tarjetas de crédito/débito, SPEI y otros métodos de pago disponibles a través de Mercado Pago.
              </p>
              <Button
                  className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105"
                  onClick={createPaymentPreference}
                  disabled={isProcessing}
              >
                  {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Banknote className="mr-2 h-4 w-4" />}
                  Continuar al Pago
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RechargeCreditsDialog;
