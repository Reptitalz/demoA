
"use client";

import React from 'react';
import { Payment } from '@mercadopago/sdk-react';

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

  // The onSubmit function is not needed for this flow.
  // Mercado Pago handles the payment processing, and confirmation is received via webhook.
  const onSubmit = async (param: any) => {
    console.log('Payment submitted (client-side):', param);
    // No backend call from client-side needed here. Webhook handles confirmation.
    onPaymentSuccess(param);
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
