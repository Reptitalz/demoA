
"use client";

import React from 'react';
import { Payment } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';

interface MercadoPagoPaymentFormProps {
  preferenceId: string;
  onPaymentSuccess: (payment: any) => void;
  onPaymentError: (error: any) => void;
}

const MercadoPagoPaymentForm = ({ preferenceId, onPaymentSuccess, onPaymentError }: MercadoPagoPaymentFormProps) => {

  const initialization = {
    amount: 1, // This is a placeholder, the real amount is in the preference
    preferenceId: preferenceId,
  };

  const customization = {
    paymentMethods: {
      creditCard: "all" as const,
      debitCard: "all" as const,
      ticket: "all" as const,
      bankTransfer: "all" as const,
      mercadoPago: "all" as const,
    },
  };

  const onSubmit = async (param: any) => {
    // This is where you would normally process the payment on your backend
    // For this example, we will just log it and call the success callback.
    console.log('Payment submitted:', param);
    return new Promise<void>((resolve, reject) => {
      // Simulate backend processing
       fetch("/api/process-payment", { // This endpoint doesn't exist, it's an example
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify(param),
       })
       .then(response => response.json())
       .then(data => {
         onPaymentSuccess(data);
         resolve();
       })
       .catch(error => {
         onPaymentError(error);
         reject();
       })
    });
  };

  const onError = async (error: any) => {
    console.error("MercadoPago Error:", error);
    onPaymentError(error);
  };

  const onReady = async () => {
    // Callback when payment brick is ready
  };

  return (
      <div className="w-full">
          <Payment
              initialization={initialization}
              customization={customization}
              onSubmit={onSubmit}
              onError={onError}
              onReady={onReady}
          />
      </div>
  );
};

export default MercadoPagoPaymentForm;

    