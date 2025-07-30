"use client";

import React, { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MercadoPagoPaymentFormProps {
  preferenceId: string;
  amount: number;
  onPaymentSuccess: () => void;
}

const MercadoPagoPaymentForm = ({ preferenceId, amount, onPaymentSuccess }: MercadoPagoPaymentFormProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { userProfile } = state;

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'es-MX' });
      setIsLoading(false);
    } else {
      console.error("Mercado Pago public key is not defined.");
      toast({
        title: "Error de Configuración",
        description: "La clave pública de Mercado Pago no está configurada.",
        variant: "destructive"
      });
    }
  }, [publicKey, toast]);

  const processPayment = async (data: any) => {
    setIsProcessingPayment(true);
    try {
        const response = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                transaction_amount: amount,
                payer: {
                  ...data.payer,
                  first_name: userProfile.firstName,
                  last_name: userProfile.lastName,
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al procesar el pago.');
        }

        onPaymentSuccess();
        
    } catch (error: any) {
        toast({
            title: 'Error de Pago',
            description: error.message || 'No se pudo completar la transacción. Por favor, intenta de nuevo.',
            variant: 'destructive'
        });
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const initialization = {
    amount: amount,
    preferenceId: preferenceId,
  };

  const customization = {
    paymentMethods: {
      maxInstallments: 1
    },
    visual: {
        style: {
            theme: 'dark'
        }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (isProcessingPayment) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-semibold">Procesando tu pago...</p>
            <p className="text-xs text-muted-foreground">Por favor, no cierres esta ventana.</p>
        </div>
    );
  }

  return (
    <CardPayment
      initialization={initialization}
      customization={customization}
      onSubmit={processPayment}
      onError={(error) => console.error(error)}
    />
  );
};

export default MercadoPagoPaymentForm;
