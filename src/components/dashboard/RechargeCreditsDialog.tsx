
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
import { CreditCard, MessagesSquare, Coins, Wallet, Loader2, Copy, CheckCircle } from 'lucide-react';
import { CREDIT_PACKAGES, MESSAGES_PER_CREDIT, PRICE_PER_CREDIT, MAX_CUSTOM_CREDITS } from '@/config/appConfig';
import { auth } from '@/lib/firebase';

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = 'selection' | 'display_clabe';

interface SpeiDetails {
    clabe: string;
    bank: string;
    amount: number;
    beneficiary: string;
}

const IVA_RATE = 1.16; // 16% IVA

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const currentCredits = state.userProfile.credits || 0;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<DialogStep>('selection');
  const [speiDetails, setSpeiDetails] = useState<SpeiDetails | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // State for purchase logic
  const [activeTab, setActiveTab] = useState<'packages' | 'custom'>('packages');
  const [selectedPackageCredits, setSelectedPackageCredits] = useState<number>(CREDIT_PACKAGES[0].credits);
  const [customCredits, setCustomCredits] = useState<number>(1);
  
  const creditsToPurchase = activeTab === 'packages' ? selectedPackageCredits : customCredits;
  const price = activeTab === 'packages'
    ? (CREDIT_PACKAGES.find(p => p.credits === selectedPackageCredits)?.price ?? 0)
    : (customCredits * PRICE_PER_CREDIT);
  const priceWithIva = price * IVA_RATE;

  // Set Conekta Public Key when the dialog is open
  useEffect(() => {
    if (isOpen && window.Conekta) {
      // NOTE: This should be in a .env.local file as NEXT_PUBLIC_CONEKTA_PUBLIC_KEY
      const CONEKTA_PUBLIC_KEY = 'key_A0GUrByZfeUSVFjLgtiUVQF';
      window.Conekta.setPublicKey(CONEKTA_PUBLIC_KEY);
      console.log('Conekta public key set for payment processing.');
    }
  }, [isOpen]);

  const handleRecharge = async () => {
    if (!creditsToPurchase || creditsToPurchase <= 0) {
      toast({ title: "Selección Requerida", description: "Por favor, selecciona o ingresa una cantidad de créditos válida.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);

    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
            throw new Error("No estás autenticado. Por favor, inicia sesión de nuevo.");
        }

        const response = await fetch('/api/create-conekta-order', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ credits: creditsToPurchase }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo crear la orden de pago.');
        }
        
        setSpeiDetails(data.speiInfo);
        setStep('display_clabe');

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!speiDetails?.clabe) return;
    navigator.clipboard.writeText(speiDetails.clabe);
    setIsCopied(true);
    toast({ title: 'Copiado', description: 'El número de CLABE se ha copiado al portapapeles.' });
    setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        setStep('selection');
        setIsProcessing(false);
        setSpeiDetails(null);
        setIsCopied(false);
    }, 300);
  };
  
  const renderContent = () => {
    switch (step) {
      case 'display_clabe':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                Completa tu pago por SPEI
              </DialogTitle>
              <DialogDescription>
                Realiza la transferencia desde tu app bancaria para completar la compra. Tus créditos se añadirán automáticamente al confirmar el pago.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
                <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                    <Label className="text-xs text-muted-foreground">Beneficiario</Label>
                    <p className="font-semibold text-lg">{speiDetails?.beneficiary}</p>
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                    <Label className="text-xs text-muted-foreground">CLABE</Label>
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-lg">{speiDetails?.clabe}</p>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copiar CLABE">
                            {isCopied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                        <Label className="text-xs text-muted-foreground">Monto a pagar (MXN)</Label>
                        <p className="font-semibold text-lg">${speiDetails?.amount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 p-3 bg-muted/50 rounded-md">
                        <Label className="text-xs text-muted-foreground">Banco Destino</Label>
                        <p className="font-semibold text-lg">{speiDetails?.bank}</p>
                    </div>
                </div>
                <p className="text-center text-xs text-muted-foreground pt-2">Esta referencia de pago expirará en 24 horas.</p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Finalizar
              </Button>
            </DialogFooter>
          </>
        );

      case 'selection':
      default:
        return (
          <>
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
                    <TabsTrigger value="packages">Paquetes</TabsTrigger>
                    <TabsTrigger value="custom">Personalizar</TabsTrigger>
                </TabsList>
                <TabsContent value="packages" className="pt-2">
                     <RadioGroup
                        value={selectedPackageCredits.toString()}
                        onValueChange={(value) => setSelectedPackageCredits(Number(value))}
                        className="mt-2 grid grid-cols-2 gap-3"
                    >
                        {CREDIT_PACKAGES.map((pkg) => (
                            <Label
                                key={pkg.credits}
                                htmlFor={`pkg-${pkg.credits}`}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer has-[input:checked]:bg-primary/10 has-[input:checked]:border-primary has-[input:checked]:ring-1 has-[input:checked]:ring-primary"
                                )}
                            >
                                <RadioGroupItem value={pkg.credits.toString()} id={`pkg-${pkg.credits}`} className="sr-only" />
                                <p className="font-bold text-lg">{pkg.credits} Créditos</p>
                                <p className="text-sm text-muted-foreground">
                                    ${(pkg.price * IVA_RATE).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                </p>
                            </Label>
                        ))}
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
                    </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button
                className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105"
                onClick={handleRecharge}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Generando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar ${priceWithIva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN con SPEI
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default RechargeCreditsDialog;
