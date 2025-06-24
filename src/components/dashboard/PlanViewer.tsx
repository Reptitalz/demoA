
"use client";

import { useState } from 'react';
import type { SubscriptionPlanDetails, SubscriptionPlanType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaCheckCircle, FaStar, FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/AppProvider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { planIcons } from "@/config/appConfig";
import { auth } from '@/lib/firebase';

interface PlanViewerProps {
  currentPlanId: SubscriptionPlanType | null;
  allPlans: SubscriptionPlanDetails[];
}

const PlanViewer = ({ currentPlanId, allPlans }: PlanViewerProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: SubscriptionPlanDetails) => {
    if (!plan.stripePriceId) {
      toast({
        title: "Plan no disponible",
        description: "Este plan no se puede comprar en este momento.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({ title: "No autenticado", description: "Debes iniciar sesión para cambiar de plan.", variant: "destructive" });
        setLoadingPlan(null);
        router.push('/app/setup');
        return;
      }
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear la sesión de pago.');
      }

      // Redirect to Stripe Checkout
      router.push(data.url);

    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error al cambiar de plan",
        description: error.message || "Ocurrió un error. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };


  return (
    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
      {allPlans.map((plan) => {
        // Don't show the test plan in the UI
        if (plan.id === 'test_plan') return null;

        const Icon = planIcons[plan.id];
        const isCurrentPlan = currentPlanId === plan.id;
        const isLoading = loadingPlan === plan.id;

        return (
          <Card
            key={plan.id}
            className={cn(
              "transition-all duration-200 shadow-md hover:shadow-lg",
              isCurrentPlan && "border-primary ring-2 ring-primary bg-primary/5"
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {Icon ? (
                    <Icon className={cn("h-7 w-7", isCurrentPlan ? "text-primary" : "text-accent")} />
                  ) : (
                    <FaStar className={cn("h-7 w-7", isCurrentPlan ? "text-primary" : "text-accent")} />
                  )}
                  <CardTitle className={cn("text-lg", isCurrentPlan && "text-primary")}>{plan.name}</CardTitle>
                </div>
                {isCurrentPlan && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1 rounded-full bg-primary/10">
                    <FaStar size={14} />
                    Plan Actual
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <p className={cn("text-2xl font-bold", isCurrentPlan ? "text-primary" : "text-accent")}>
                  ${plan.priceMonthly}
                  <span className={cn("text-sm font-normal", isCurrentPlan ? "text-primary/80" : "text-muted-foreground")}>/mes</span>
                </p>
                 <p className={cn("text-sm", isCurrentPlan ? "text-primary/90" : "text-muted-foreground")}>
                    {plan.assistantLimit === "unlimited" ? "Ilimitados" : plan.assistantLimit} {typeof plan.assistantLimit === 'number' && plan.assistantLimit === 1 ? 'Asistente' : 'Asistentes'}
                  </p>
              </div>
              
              <ul className="space-y-1.5 text-sm">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <FaCheckCircle className={cn("h-4 w-4 mr-2 shrink-0", isCurrentPlan ? "text-primary/80" : "text-green-500")} />
                    <span className={isCurrentPlan ? "text-foreground" : "text-muted-foreground"}>{feature}</span>
                  </li>
                ))}
              </ul>
              {!isCurrentPlan && plan.id !== 'free' && (
                <Button 
                  className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                >
                  {isLoading ? <FaSpinner className="animate-spin mr-2" /> : null}
                  {isLoading ? 'Procesando...' : `Cambiar a ${plan.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PlanViewer;
