"use client";

import React, { useEffect, useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PRICE_PER_CREDIT } from '@/config/appConfig';

interface MercadoPagoPaymentFormProps {
  credits: number; // Changed from amount
  onPaymentSuccess: () => void;
}

const MercadoPagoPaymentForm = ({ credits, onPaymentSuccess }: MercadoPagoPaymentFormProps) => {
  const { state } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { userProfile } = state;

  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const amount = credits * PRICE_PER_CREDIT; // Calculate amount here

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
        const external_reference = `${userProfile._id?.toString()}__${credits}__${Date.now()}`;
        const response = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                credits: credits, // Pass credits to the backend
                external_reference: external_reference,
            })
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'approved') {
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
      onReady={() => console.log('Card Payment Brick is ready')}
      onError={(error) => console.error(error)}
    />
  );
};

export default MercadoPagoPaymentForm;
