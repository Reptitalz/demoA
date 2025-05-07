
"use client";

import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { subscriptionPlansConfig } from "@/config/appConfig";
import type { SubscriptionPlanType } from "@/types";
import { CheckCircle, ListChecks, TrendingUp, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const planIcons: { [key in SubscriptionPlanType]: React.ElementType } = {
  free: CheckCircle,
  standard_39: ListChecks,
  premium_179: TrendingUp,
  business_270: Briefcase,
};

const Step4SubscriptionPlan = ({ onCompleteSetup }: { onCompleteSetup: () => void }) => {
  const { state, dispatch } = useApp();
  const { selectedPlan } = state.wizard;

  const handlePlanSelect = (planId: SubscriptionPlanType) => {
    dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: planId });
  };

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle>Elige tu Plan</CardTitle>
        <CardDescription>Selecciona el plan que mejor se adapte a tus necesidades.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedPlan || ""}
          onValueChange={(value) => handlePlanSelect(value as SubscriptionPlanType)}
          className="space-y-4"
          aria-label="Planes de Suscripción"
        >
          {subscriptionPlansConfig.map((plan) => {
            const Icon = planIcons[plan.id];
            const isSelected = selectedPlan === plan.id;
            return (
              <Label
                key={plan.id}
                htmlFor={`plan-${plan.id}`}
                className={cn(
                  "flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer",
                  isSelected && "bg-accent text-accent-foreground border-primary ring-2 ring-primary shadow-md"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className={cn(isSelected && "border-primary-foreground text-primary-foreground bg-primary")} />
                    <Icon className={cn("h-6 w-6", isSelected ? "text-accent-foreground" : "text-primary")} />
                    <span className="font-semibold text-lg">{plan.name}</span>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xl font-bold", isSelected ? "text-accent-foreground" : "text-primary")}>
                      ${plan.priceMonthly}
                      <span className={cn("text-sm font-normal", isSelected ? "text-accent-foreground/80" : "text-muted-foreground")}>/mes</span>
                    </p>
                    <p className={cn("text-xs", isSelected ? "text-accent-foreground/80" : "text-muted-foreground")}>
                      {plan.assistantLimit === "unlimited" ? "Ilimitados" : plan.assistantLimit} {typeof plan.assistantLimit === 'number' && plan.assistantLimit === 1 ? 'Asistente' : 'Asistentes'}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 pl-8 space-y-1 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className={cn("h-4 w-4 mr-2 shrink-0", isSelected ? "text-accent-foreground/90" : "text-green-500")} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full text-lg py-6 transition-transform transform hover:scale-105" 
          onClick={onCompleteSetup}
          disabled={!selectedPlan}
          aria-disabled={!selectedPlan}
        >
          Completar Configuración y Continuar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Step4SubscriptionPlan;
