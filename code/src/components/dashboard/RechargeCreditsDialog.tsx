
"use client";

import React, { useState } from 'react';
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

const CREDIT_PACKAGES = [
  { credits: 1, price: 50, name: "Básico" },
  { credits: 5, price: 240, name: "Estándar" }, // Small discount
  { credits: 10, price: 450, name: "Pro" }, // Better discount
  { credits: 25, price: 1000, name: "Premium" }, // Best discount
];
const MESSAGES_PER_CREDIT = 1000;

interface RechargeCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeCreditsDialog = ({ isOpen, onOpenChange }: RechargeCreditsDialogProps) => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const currentCredits = state.userProfile.credits || 0;
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const handleRecharge = () => {
    if (selectedPackage === null) {
      toast({
        title: "Selección Requerida",
        description: "Por favor, selecciona un paquete de créditos para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      const packageDetails = CREDIT_PACKAGES.find(p => p.credits === selectedPackage);
      if (packageDetails) {
        const newTotalCredits = currentCredits + packageDetails.credits;
        dispatch({ type: 'UPDATE_USER_PROFILE', payload: { credits: newTotalCredits } });
        setPurchaseComplete(true);
      }
      setIsProcessing(false);
    }, 1500);
  };
  
  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
        setSelectedPackage(null);
        setPurchaseComplete(false);
    }, 300);
  };
  
  const selectedPackageDetails = selectedPackage !== null ? CREDIT_PACKAGES.find(p => p.credits === selectedPackage) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!purchaseComplete ? (
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
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Procesando Pago...
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
        ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-fadeIn">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <DialogTitle className="text-xl">¡Recarga Exitosa!</DialogTitle>
                <DialogDescription className="mt-2">
                    Se han añadido {selectedPackage} créditos a tu cuenta.
                </DialogDescription>
                <p className="mt-4 text-2xl font-bold text-foreground">
                    Saldo total: {currentCredits} créditos
                </p>
                 <DialogFooter className="mt-6 w-full">
                    <Button onClick={handleClose} className="w-full">
                        Cerrar
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RechargeCreditsDialog;
