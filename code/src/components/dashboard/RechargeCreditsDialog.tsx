
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
import { CreditCard, MessagesSquare, Coins, Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { CREDIT_PACKAGES, MESSAGES_PER_CREDIT } from '@/config/appConfig';
import { auth } from '@/lib/firebase';

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = 'selection' | 'payment' | 'success';

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const currentCredits = state.userProfile.credits || 0;
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<DialogStep>('selection');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY) {
      (window as any).Conekta.setPublicKey(process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY);
    } else {
        console.warn("La clave pública de Conekta no está configurada. Los pagos fallarán.");
    }
  }, []);

  const handleRecharge = async () => {
    if (selectedPackage === null) {
      toast({
        title: "Selección Requerida",
        description: "Por favor, selecciona un paquete de créditos para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_CONEKTA_PUBLIC_KEY) {
        toast({ title: "Error de Configuración", description: "La pasarela de pago no está configurada.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    setStep('payment');

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
            body: JSON.stringify({ packageCredits: selectedPackage }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo crear la orden de pago.');
        }

        const checkout = new (window as any).Conekta.Checkout({
            target: '#conekta-checkout-container',
            checkout_order_id: data.checkout.id,
            onFinalize: (details: any) => {
                if (details.charge && details.charge.status === 'paid') {
                    const packageDetails = CREDIT_PACKAGES.find(p => p.credits === selectedPackage);
                    if (packageDetails) {
                        const newTotalCredits = currentCredits + packageDetails.credits;
                        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { credits: newTotalCredits } });
                        setStep('success');
                    }
                } else {
                    toast({
                        title: "Pago no completado",
                        description: `El estado del pago es: ${details.charge?.status || 'desconocido'}. Intenta de nuevo.`,
                        variant: "destructive",
                    });
                    handleClose();
                }
            },
            onError: (error: any) => {
                toast({
                    title: "Error en el Pago",
                    description: error.message_to_purchaser || "Ocurrió un error. Por favor, intenta de nuevo.",
                    variant: "destructive",
                });
                handleClose();
            }
        });
        
        checkout.render();
        
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        handleClose();
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
        setStep('selection');
        setSelectedPackage(null);
        setIsProcessing(false);
    }, 300);
  };
  
  const selectedPackageDetails = selectedPackage !== null ? CREDIT_PACKAGES.find(p => p.credits === selectedPackage) : null;

  const renderContent = () => {
    switch (step) {
      case 'payment':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Finaliza tu Compra</DialogTitle>
              <DialogDescription>
                Haz clic en el botón de abajo para completar tu pago de forma segura con Conekta.
              </DialogDescription>
            </DialogHeader>
            <div id="conekta-checkout-container" className="min-h-[100px] flex items-center justify-center">
              {/* Conekta injects its button here */}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            </DialogFooter>
          </>
        );

      case 'success':
        return (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-fadeIn">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <DialogTitle className="text-xl">¡Recarga Exitosa!</DialogTitle>
                <DialogDescription className="mt-2">
                    Se han añadido {selectedPackage} créditos a tu cuenta.
                </DialogDescription>
                <p className="mt-4 text-2xl font-bold text-foreground">
                    Saldo total: {currentCredits + (selectedPackage || 0)} créditos
                </p>
                 <DialogFooter className="mt-6 w-full">
                    <Button onClick={handleClose} className="w-full">
                        Cerrar
                    </Button>
                </DialogFooter>
            </div>
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
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5 text-accent" />
                    <p className="text-2xl font-bold">{(currentCredits * MESSAGES_PER_CREDIT).toLocaleString()}</p>
                    <span className="text-xs text-muted-foreground mt-2">Mensajes</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="font-semibold text-base">Selecciona un Paquete de Créditos</Label>
                <RadioGroup
                    value={selectedPackage?.toString()}
                    onValueChange={(value) => setSelectedPackage(Number(value))}
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
                            <p className="text-sm text-muted-foreground">${pkg.price} MXN</p>
                        </Label>
                    ))}
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="w-full bg-brand-gradient text-primary-foreground hover:opacity-90 transition-transform transform hover:scale-105"
                onClick={handleRecharge}
                disabled={isProcessing || selectedPackage === null}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Redirigiendo a Conekta...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar ${selectedPackageDetails ? selectedPackageDetails.price : '0'} MXN
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
