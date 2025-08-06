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
import { MessagesSquare, Coins, Wallet as WalletIcon, Loader2, CreditCard } from 'lucide-react';
import { CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT, MAX_CUSTOM_CREDITS } from '@/config/appConfig';
import { Button } from '../ui/button';
import MercadoPagoIcon from '@/components/shared/MercadoPagoIcon';
import MercadoPagoPaymentForm from './MercadoPagoPaymentForm';
import PersonalInfoDialog from './PersonalInfoDialog';

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state, dispatch, fetchProfileCallback } = useApp();
  const { toast } = useToast();
  const { userProfile } = state;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'options' | 'cardForm'>('options');
  const [activeTab, setActiveTab] = useState<'packages' | 'custom'>('packages');
  const [selectedPackageCredits, setSelectedPackageCredits] = useState<number>(CREDIT_PACKAGES[0].credits);
  const [customCredits, setCustomCredits] = useState<number>(1);
  const [isPersonalInfoDialogOpen, setIsPersonalInfoDialogOpen] = useState(false);
  
  const creditsToPurchase = activeTab === 'packages' ? selectedPackageCredits : customCredits;
  
  const totalMessagesFromCredits = (userProfile.credits || 0) * MESSAGES_PER_CREDIT;
  const totalConsumedMessages = userProfile.assistants.reduce((sum, asst) => sum + (asst.messageCount || 0), 0);
  const availableMessages = totalMessagesFromCredits - totalConsumedMessages;

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setView('options');
      setActiveTab('packages');
      setSelectedPackageCredits(CREDIT_PACKAGES[0].credits);
      setCustomCredits(1);
    }
  }, [isOpen]);

  const validateAndProceed = (callback: () => void) => {
     if (!userProfile.firstName || !userProfile.lastName) {
      toast({
        title: "Información Requerida",
        description: "Por favor, completa tu información personal para continuar con el pago.",
        variant: "default",
      });
      setIsPersonalInfoDialogOpen(true);
      return;
    }
    
    if (!creditsToPurchase || creditsToPurchase <= 0) {
      toast({ title: "Selección Requerida", description: "Por favor, selecciona o ingresa una cantidad de créditos válida.", variant: "destructive" });
      return;
    }
    callback();
  }

  const handlePayWithCard = () => {
    validateAndProceed(() => setView('cardForm'));
  };

  const handlePayWithMercadoPagoRedirect = async () => {
    validateAndProceed(async () => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/create-mercadopago-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    credits: creditsToPurchase, 
                    userDbId: userProfile._id?.toString() 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'No se pudo iniciar el pago.');
            }

            // Redirect to Mercado Pago's checkout page
            window.location.href = data.initPointUrl;

        } catch (error: any) {
            toast({
                title: 'Error al iniciar pago',
                description: error.message,
                variant: 'destructive',
            });
            setIsProcessing(false);
        }
    });
  };
  
  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
  };
  
  const handlePaymentSuccess = () => {
    toast({
      title: "¡Pago Exitoso!",
      description: "Tus créditos han sido añadidos a tu cuenta.",
    });
    if (userProfile.email) {
        fetchProfileCallback(userProfile.email);
    }
    handleClose();
  };
  
  const purchaseAmount = activeTab === 'packages' 
    ? (CREDIT_PACKAGES.find(p => p.credits === selectedPackageCredits)?.price || 0)
    : customCredits * PRICE_PER_CREDIT;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isProcessing) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <WalletIcon className="h-6 w-6 text-primary" /> Recargar Saldo
          </DialogTitle>
           {view === 'options' && (
            <DialogDescription>
              Añade créditos a tu cuenta para continuar usando tus asistentes.
            </DialogDescription>
          )}
           {view === 'cardForm' && (
            <DialogDescription>
              Ingresa los datos de tu tarjeta para completar la compra.
            </DialogDescription>
          )}
        </DialogHeader>

        {view === 'options' && (
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
                      <p className="text-2xl font-bold">{availableMessages.toLocaleString()}</p>
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
              <div className="flex flex-col gap-2 pt-2">
                 <Button
                    className="w-full"
                    onClick={handlePayWithCard}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Pagar con Tarjeta
                </Button>
                 <Button
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={handlePayWithMercadoPagoRedirect}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <MercadoPagoIcon className="mr-2 h-4 w-auto"/>}
                    Pagar en Mercado Pago
                </Button>
                <p className="text-center text-xs text-muted-foreground">Paga con SPEI, OXXO, saldo en cuenta y más.</p>
              </div>
          </div>
        )}
        {view === 'cardForm' && (
            <div className="animate-fadeIn">
                 <MercadoPagoPaymentForm
                    credits={creditsToPurchase}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                  <Button variant="link" size="sm" className="w-full mt-2" onClick={() => setView('options')}>
                      Volver
                  </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
    <PersonalInfoDialog
      isOpen={isPersonalInfoDialogOpen}
      onOpenChange={setIsPersonalInfoDialogOpen}
    />
    </>
  );
};

export default RechargeCreditsDialog;
