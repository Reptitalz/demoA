
"use client";

import { useApp } from "@/providers/AppProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardFooter
// Removed Button import as it's no longer used here
import { subscriptionPlansConfig, planIcons } from "@/config/appConfig";
import type { SubscriptionPlanType } from "@/types";
import { FaCheckCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";

const Step4SubscriptionPlan = ({ onCompleteSetup }: { onCompleteSetup: () => void }) => {
  const { state, dispatch } = useApp();
  const { selectedPlan } = state.wizard;

  const handlePlanSelect = (planId: SubscriptionPlanType) => {
    dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: planId });
  };

  // The onCompleteSetup function is passed but will be called by the main button in SetupPage

  return (
    <Card className="w-full shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Elige tu Plan</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Selecciona el plan que mejor se adapte a tus necesidades.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedPlan || ""}
          onValueChange={(value) => handlePlanSelect(value as SubscriptionPlanType)}
          className="space-y-3"
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
                  "flex flex-col p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer",
                  isSelected && "bg-primary/10 border-primary ring-1 ring-primary" 
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className={cn(isSelected && "border-primary text-primary bg-primary", "h-3.5 w-3.5 sm:h-4 sm:w-4")} />
                    <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", isSelected ? "text-primary" : "text-brand-gradient")} /> 
                    <span className="font-semibold text-sm sm:text-base">{plan.name}</span> 
                  </div>
                  <div className="text-right">
                    <p className={cn("text-base sm:text-lg font-bold", isSelected ? "text-primary" : "text-brand-gradient")}> 
                      ${plan.priceMonthly}
                      <span className={cn("text-xs sm:text-sm font-normal text-muted-foreground")}>/mes</span> 
                    </p>
                    <p className={cn("text-xs text-muted-foreground")}> 
                      {plan.assistantLimit === "unlimited" ? "Ilimitados" : plan.assistantLimit} {typeof plan.assistantLimit === 'number' && plan.assistantLimit === 1 ? 'Asistente' : 'Asistentes'}
                    </p>
                  </div>
                </div>
                <ul className="mt-2 pl-6 sm:pl-7 space-y-1 text-xs sm:text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <FaCheckCircle className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0 text-green-500")} />
                      {feature} 
                    </li>
                  ))}
                </ul>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
      {/* CardFooter containing the button has been removed */}
    </Card>
  );
};

export default Step4SubscriptionPlan;
